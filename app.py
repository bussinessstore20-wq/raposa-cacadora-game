import os
import json
import time
import hmac
import hashlib
from urllib.parse import parse_qsl

from flask import Flask, request, jsonify, send_from_directory
from supabase import create_client, Client


app = Flask(__name__, static_folder="static")


# ============================================================
# CONFIGURAÇÕES
# ============================================================

BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN")
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")


if not BOT_TOKEN:
    print("AVISO: TELEGRAM_BOT_TOKEN não configurado.")

if not SUPABASE_URL:
    print("AVISO: SUPABASE_URL não configurado.")

if not SUPABASE_SERVICE_ROLE_KEY:
    print("AVISO: SUPABASE_SERVICE_ROLE_KEY não configurado.")


supabase: Client | None = None

if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY:
    supabase = create_client(
        SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY
    )


# ============================================================
# PÁGINA PRINCIPAL
# ============================================================

@app.route("/")
def index():
    return send_from_directory("static", "index.html")


# ============================================================
# HEALTH CHECK
# ============================================================

@app.route("/health")
def health():
    return jsonify({
        "status": "ok"
    })


# ============================================================
# VALIDAÇÃO DO TELEGRAM MINI APP
# ============================================================

def validate_telegram_init_data(init_data: str):

    if not BOT_TOKEN:
        return None

    try:
        parsed_data = dict(parse_qsl(
            init_data,
            keep_blank_values=True
        ))

        received_hash = parsed_data.pop("hash", None)

        if not received_hash:
            return None

        # Remove dados antigos.
        auth_date = parsed_data.get("auth_date")

        if not auth_date:
            return None

        # Não aceitar dados muito antigos.
        if time.time() - int(auth_date) > 86400:
            return None

        data_check_string = "\n".join(
            f"{key}={parsed_data[key]}"
            for key in sorted(parsed_data)
        )

        secret_key = hmac.new(
            b"WebAppData",
            BOT_TOKEN.encode(),
            hashlib.sha256
        ).digest()

        calculated_hash = hmac.new(
            secret_key,
            data_check_string.encode(),
            hashlib.sha256
        ).hexdigest()

        if not hmac.compare_digest(
            calculated_hash,
            received_hash
        ):
            return None

        return parsed_data

    except Exception as error:
        print("Erro ao validar Telegram:", error)
        return None


# ============================================================
# LOGIN DO USUÁRIO
# ============================================================

@app.route("/api/auth", methods=["POST"])
def authenticate():

    data = request.get_json(silent=True) or {}

    init_data = data.get("initData")

    if not init_data:
        return jsonify({
            "success": False,
            "error": "initData não informado"
        }), 400

    telegram_data = validate_telegram_init_data(init_data)

    if not telegram_data:
        return jsonify({
            "success": False,
            "error": "Dados do Telegram inválidos"
        }), 401

    user_json = telegram_data.get("user")

    if not user_json:
        return jsonify({
            "success": False,
            "error": "Usuário não encontrado"
        }), 400

    try:
        telegram_user = json.loads(user_json)

        telegram_id = telegram_user["id"]
        username = telegram_user.get("username")
        first_name = telegram_user.get("first_name", "")

        if not supabase:
            return jsonify({
                "success": False,
                "error": "Supabase não configurado"
            }), 500

        result = (
            supabase
            .table("game_users")
            .upsert(
                {
                    "telegram_id": telegram_id,
                    "username": username,
                    "first_name": first_name
                },
                on_conflict="telegram_id"
            )
            .execute()
        )

        user = result.data[0] if result.data else None

        return jsonify({
            "success": True,
            "user": user
        })

    except Exception as error:

        print("Erro ao autenticar usuário:", error)

        return jsonify({
            "success": False,
            "error": "Erro interno"
        }), 500


# ============================================================
# INICIAR SERVIDOR
# ============================================================

if __name__ == "__main__":

    port = int(
        os.environ.get("PORT", 10000)
    )

    app.run(
        host="0.0.0.0",
        port=port
    )
