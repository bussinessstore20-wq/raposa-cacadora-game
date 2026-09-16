let score = 0;
let streak = 0;

const playButton = document.getElementById("playButton");
const game = document.getElementById("game");
const ranking = document.getElementById("ranking");
const result = document.getElementById("result");

playButton.addEventListener("click", () => {
    game.classList.remove("hidden");
    ranking.classList.add("hidden");

    game.scrollIntoView({
        behavior: "smooth"
    });
});

document.querySelectorAll(".option").forEach((button) => {

    button.addEventListener("click", () => {

        const answer = button.dataset.answer;

        document.querySelectorAll(".option").forEach((item) => {
            item.disabled = true;
        });

        if (answer === "89") {

            score += 100;
            streak += 1;

            result.textContent = "🎉 Acertou! +100 pontos";
            result.className = "result success";

        } else {

            streak = 0;

            result.textContent = "❌ Errou! A resposta era R$ 89,90";
            result.className = "result error";
        }

        document.getElementById("score").textContent = score;
        document.getElementById("streak").textContent = streak;
    });

});

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
