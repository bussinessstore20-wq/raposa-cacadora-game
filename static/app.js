console.log("RAPOSA GAME: app.js carregou");

const debug = document.getElementById("debug");

if (debug) {
    debug.textContent = "🟢 JavaScript carregou!";
}

const telegram = window.Telegram?.WebApp;

if (!telegram) {

    if (debug) {
        debug.textContent =
            "🟡 JavaScript carregou, mas Telegram WebApp não foi encontrado.";
    }

    console.log("Telegram WebApp não encontrado.");

} else {

    telegram.ready();
    telegram.expand();

    console.log("Telegram WebApp encontrado.");
    console.log("initData:", telegram.initData);
    console.log("Usuário:", telegram.initDataUnsafe?.user);

    if (!telegram.initData) {

        debug.textContent =
            "🟠 Telegram encontrado, mas initData está vazio.";

    } else {

        const user =
            telegram.initDataUnsafe?.user;

        if (user) {

            debug.textContent =
                `🟢 Telegram OK! Olá, ${user.first_name || "Caçador"}!`;

        } else {

            debug.textContent =
                "🟠 Telegram OK, mas usuário não encontrado.";

        }
    }
}


// ------------------------------------------------------------
// BOTÃO JOGAR
// ------------------------------------------------------------

const playButton =
    document.getElementById("playButton");

const game =
    document.getElementById("game");

if (playButton && game) {

    playButton.addEventListener(
        "click",
        () => {

            game.classList.remove("hidden");

            game.scrollIntoView({
                behavior: "smooth"
            });

        }
    );

}


// ------------------------------------------------------------
// RANKING
// ------------------------------------------------------------

function showRanking() {

    const ranking =
        document.getElementById("ranking");

    if (ranking) {

        ranking.classList.remove("hidden");

    }

}


function closeRanking() {

    const ranking =
        document.getElementById("ranking");

    if (ranking) {

        ranking.classList.add("hidden");

    }

}
