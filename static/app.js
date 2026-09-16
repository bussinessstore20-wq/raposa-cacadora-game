let score = 0;
let streak = 0;
let currentUser = null;

const playButton = document.getElementById("playButton");
const game = document.getElementById("game");
const ranking = document.getElementById("ranking");
const result = document.getElementById("result");


// ============================================================
// TELEGRAM MINI APP
// ============================================================

const telegram = window.Telegram?.WebApp;

if (telegram) {
    telegram.ready();
    telegram.expand();
}


// ============================================================
// AUTENTICAÇÃO
// ============================================================

async function authenticateUser() {

    if (!telegram) {
        console.log("Game aberto fora do Telegram.");

        return;
    }

    const initData = telegram.initData;

    if (!initData) {
        console.log("Nenhum initData encontrado.");

        return;
    }

    try {

        const response = await fetch("/api/auth", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                initData: initData
            })

        });

        const data = await response.json();

        if (!data.success) {

            console.error(
                "Erro na autenticação:",
                data.error
            );

            return;
        }

        currentUser = data.user;

        updateUserInterface();

        console.log(
            "Usuário autenticado:",
            currentUser
        );

    } catch (error) {

        console.error(
            "Erro ao conectar com o servidor:",
            error
        );

    }
}


// ============================================================
// ATUALIZAR INTERFACE
// ============================================================

function updateUserInterface() {

    if (!currentUser) {
        return;
    }

    score = currentUser.points || 0;
    streak = currentUser.streak || 0;

    document.getElementById("score").textContent = score;
    document.getElementById("streak").textContent = streak;

    const subtitle = document.querySelector(".subtitle");

    if (subtitle) {

        const name =
            currentUser.first_name ||
            currentUser.username ||
            "Caçador";

        subtitle.textContent =
            `Olá, ${name}! Encontre a oferta. Acerte o preço. Ganhe pontos.`;
    }
}


// ============================================================
// BOTÃO JOGAR
// ============================================================

playButton.addEventListener("click", () => {

    game.classList.remove("hidden");
    ranking.classList.add("hidden");

    game.scrollIntoView({
        behavior: "smooth"
    });

});


// ============================================================
// RESPOSTAS DO DESAFIO
// ============================================================

document.querySelectorAll(".option").forEach((button) => {

    button.addEventListener("click", () => {

        const answer = button.dataset.answer;

        document.querySelectorAll(".option").forEach((item) => {
            item.disabled = true;
        });

        if (answer === "89") {

            score += 100;
            streak += 1;

            result.textContent =
                "🎉 Acertou! +100 pontos";

            result.className =
                "result success";

        } else {

            streak = 0;

            result.textContent =
                "❌ Errou! A resposta era R$ 89,90";

            result.className =
                "result error";
        }

        document.getElementById("score").textContent = score;
        document.getElementById("streak").textContent = streak;

    });

});


// ============================================================
// RANKING
// ============================================================

function showRanking() {

    ranking.classList.remove("hidden");
    game.classList.add("hidden");

    ranking.scrollIntoView({
        behavior: "smooth"
    });

}


function closeRanking() {

    ranking.classList.add("hidden");

}


// ============================================================
// INICIAR
// ============================================================

authenticateUser();
