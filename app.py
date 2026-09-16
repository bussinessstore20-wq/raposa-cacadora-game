import os
import json
import time
import hmac
import hashlib

from urllib.parse import parse_qsl

from flask import Flask, request, jsonify, send_from_directory
from supabase import create_client


# ============================================================
# APP
# ============================================================

app = Flask(
    __name__,
    static_folder="static"
)


# ============================================================
# VARIÁVEIS DE AMBIENTE
# ============================================================

BOT_TOKEN = os.environ.get(
    "TELEGRAM_BOT_TOKEN"
)

SUPABASE_URL = os.environ.get(
    "SUPABASE_URL"
)

SUPABASE_SERVICE_ROLE_KEY = os.environ.get(
    "SUPABASE_SERVICE_ROLE_KEY"
)


# ============================================================
# SUPABASE
# ============================================================

supabase = None

if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY:

    supabase = create_client(
        SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY
    )


# ============================================================
# HOME
# ============================================================

@app.route("/")
def index():

    return send_from_directory(
        "static",
        "index.html"
    )


# ============================================================
# HEALTH
# ============================================================

@app.route("/health")
def health():

    return jsonify({
        "status": "ok"
    })


# ============================================================
# VALIDAR TELEGRAM
# ============================================================

def validate_telegram_init_data(
    init_data
):

    if not BOT_TOKEN:

        print(
            "ERRO: TELEGRAM_BOT_TOKEN não configurado."
        )

        return None


    try:

        parsed_data = dict(
            parse_qsl(
                init_data,
                keep_blank_values=True
            )
        )


        received_hash = parsed_data.pop(
            "hash",
            None
        )


        if not received_hash:

            print(
                "ERRO: hash não encontrado."
            )

            return None


        auth_date = parsed_data.get(
            "auth_date"
        )


        if not auth_date:

            print(
                "ERRO: auth_date não encontrado."
            )

            return None


        # Dados com mais de 24 horas são rejeitados.

        if (
            time.time() -
            int(auth_date)
            > 86400
        ):

            print(
                "ERRO: initData expirado."
            )

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

            print(
                "ERRO: hash do Telegram inválido."
            )

            return None


        return parsed_data


    except Exception as error:

        print(
            "ERRO VALIDANDO TELEGRAM:",
            repr(error)
        )

        return None


# ============================================================
# AUTENTICAÇÃO
# ============================================================

@app.route(
    "/api/auth",
    methods=["POST"]
)
def authenticate():

    try:

        data = request.get_json(
            silent=True
        ) or {}


        init_data = data.get(
            "initData"
        )


        if not init_data:

            return jsonify({

                "success": False,

                "error":
                    "initData não informado"

            }), 400


        telegram_data = (
            validate_telegram_init_data(
                init_data
            )
        )


        if not telegram_data:

            return jsonify({

                "success": False,

                "error":
                    "Dados do Telegram inválidos"

            }), 401


        user_json = telegram_data.get(
            "user"
        )


        if not user_json:

            return jsonify({

                "success": False,

                "error":
                    "Usuário não encontrado"

            }), 400


        telegram_user = json.loads(
            user_json
        )


        telegram_id = telegram_user[
            "id"
        ]


        username = telegram_user.get(
            "username"
        )


        first_name = telegram_user.get(
            "first_name",
            ""
        )


        print(
            "Usuário Telegram:",
            telegram_id,
            first_name
        )


        # ----------------------------------------------------
        # SUPABASE
        # ----------------------------------------------------

        if not supabase:

            print(
                "ERRO: Supabase não configurado."
            )

            return jsonify({

                "success": False,

                "error":
                    "Supabase não configurado"

            }), 500


        # ----------------------------------------------------
        # PROCURAR USUÁRIO
        # ----------------------------------------------------

        existing = (
            supabase
            .table("game_users")
            .select("*")
            .eq(
                "telegram_id",
                telegram_id
            )
            .limit(1)
            .execute()
        )


        # ----------------------------------------------------
        # USUÁRIO JÁ EXISTE
        # ----------------------------------------------------

        if existing.data:

            user = existing.data[0]


            # Atualizar nome/username.

            updated = (
                supabase
                .table("game_users")
                .update({

                    "username":
                        username,

                    "first_name":
                        first_name

                })
                .eq(
                    "telegram_id",
                    telegram_id
                )
                .execute()
            )


            if updated.data:

                user = updated.data[0]


        # ----------------------------------------------------
        # NOVO USUÁRIO
        # ----------------------------------------------------

        else:

            created = (
                supabase
                .table("game_users")
                .insert({

                    "telegram_id":
                        telegram_id,

                    "username":
                        username,

                    "first_name":
                        first_name,

                    "points":
                        0,

                    "streak":
                        0

                })
                .execute()
            )


            if not created.data:

                raise Exception(
                    "Supabase não retornou o usuário criado."
                )


            user = created.data[0]


        print(
            "Usuário salvo no Supabase:",
            user
        )


        return jsonify({

            "success": True,

            "user": user

        })


    except Exception as error:

        print(
            "ERRO INTERNO /api/auth:"
        )

        print(
            repr(error)
        )


        return jsonify({

            "success": False,

            "error":
                "Erro interno: " +
                str(error)

        }), 500


# ============================================================
# SERVIDOR
# ============================================================

if __name__ == "__main__":

    port = int(
        os.environ.get(
            "PORT",
            10000
        )
    )


    app.run(
        host="0.0.0.0",
        port=port
    )
