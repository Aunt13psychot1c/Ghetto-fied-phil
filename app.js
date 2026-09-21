const $ = (id) => document.getElementById(id);

const els = {
  rollText: $("rollText"),
  diceEmoji: $("diceEmoji"),
  pointText: $("pointText"),
  philLine: $("philLine"),
  cashText: $("cashText"),
  betText: $("betText"),
  betSlider: $("betSlider"),
  shootBtn: $("shootBtn"),
};

let balance = 100;
let bet = 30;
let point = 0;
let phase = "betting"; // betting | rolling | grabbing | snatching
let grabTimer = null;

const sound = {
  roll: new Audio("./sfx/roll.wav"),
  win: new Audio("./sfx/win.wav"),
  lose: new Audio("./sfx/lose.wav"),
  snatch: new Audio("./sfx/snatch.wav"),
  grab: new Audio("./sfx/grab.wav"),
};
const play = (s) => s.cloneNode().play().catch(() => {});

const LINES = {
  intro: [
    "AYYY. BOUT TIME YOU SHOWED UP TO MY CORNER. YOU GOT MONEY? GOOD. GIMME IT.",
    "LOOK HERE. I AIN'T NO FINANCIAL ADVISER. I'M PHIL. AND PHIL WANTS THAT CASH.",
    "MENTHOLS. MY DADDY WENT OUT FOR MENTHOLS AND NEVER CAME BACK. NOW I'M THE ONE HUSTLIN'.",
  ],
  comeWin: ["AYYY, SEVEN! YOU GOT IT! NOW GET YOUR DAMN HANDS ON THAT CASH!", "ELEVEN! HOT DAMN, LUCKY SOB. GRAB IT BEFORE I DO!", "AWW SHIT. HE REALLY HIT IT. MOVE, MOVE, IT'S MY MONEY TOO!"],
  comeLose: ["BOY, YOU ROLLED A TWO! THAT MONEY BEEN MINE!", "THREE? HA! CHECK YOUR POCKETS TOMORROW.", "SNAKE EYES, BABY. YOU THOUGHT YOU HAD IT. PHIL AIN'T DUMB."],
  point7: ["BOY, YOU ROLLED A SEVEN! THAT MONEY BEEN MINE!", "SEVEN, SEVEN, SEVEN! WELCOME BACK TO BROKE, CHAMP.", "YOU LET THAT 7 SCREAM AND PHIL JUST ATE. CHECK YOUR POCKETS."],
  pointHit: ["AYYY, YOU HIT YOUR POINT! NOW GRAB THAT CASH!", "POINT'S MADE! THAT MONEY IS YOURS IF YOU'RE FAST ENOUGH, HOE.", "BOOM! TOLD YOU NOT TO TRUST THAT POINT. C'MON, GRAB IT!"],
  rollAgain: ["NEW POINT: THAT NUMBER. YOU GOT ONE JOB — HIT IT BEFORE SEVEN SHOWS UP.", "ALRIGHT ALRIGHT, YOU LIVE. LET'S SEE YOU HIT THAT POINT.", "POINT ESTABLISHED. KEEP ROLLIN', SHORTY. SEVEN ENDS YA."],
};

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function setSpeech(line) {
  els.philLine.textContent = "Phil: " + line;
}

function updateBalance() {
  const delta = balance - (window.__lastShown ?? balance);
  els.cashText.textContent = "Your virtual cash 💵 $" + balance;
  if (delta !== null && delta !== 0) cashToast(delta);
  window.__lastShown = balance;
}

function cashToast(delta) {
  let toast = document.getElementById("cashToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "cashToast";
    document.body.appendChild(toast);
  }
  const up = delta > 0;
  toast.textContent = (up ? "＋" : "−") + "$" + Math.abs(delta) + (up ? " GRABBED!" : " PHIL TOOK IT");
  toast.className = "cash-toast " + (up ? "up" : "down");
  clearTimeout(window.__toastT);
  window.__toastT = setTimeout(() => (toast.className = "cash-toast hide"), 1400);
}

function setBetDisplay() {
  els.betText.innerHTML = "Bet: <b>$" + bet + "</b> in play money";
  els.betSlider.value = bet;
  els.betSlider.max = Math.max(10, balance);
}

function setDice(a, b, rolling) {
  els.rollText.textContent = `${a} + ${b} = ${a + b}`;
  els.diceEmoji.textContent = "🎲 🎲";
  if (rolling) {
    els.diceEmoji.classList.add("rolling");
  } else {
    els.diceEmoji.classList.remove("rolling");
  }
}

function setRollBtn(label, disabled) {
  els.shootBtn.textContent = label;
  els.shootBtn.disabled = disabled;
}

function showStatus(text) {
  els.philLine.textContent = "Phil: " + text;
}

function makeGrabOverlay(winAmount) {
  const overlay = document.createElement("div");
  overlay.className = "grab-overlay";
  overlay.innerHTML = `
    <div class="grab-card">
      <div class="big">💸</div>
      <h2>GRAB THE CASH!</h2>
      <div class="grab-win">$${winAmount}</div>
      <div class="grab-timer" id="grabTimer">12</div>
      <button class="grab-btn" id="grabBtn">GRAB THE CASH!</button>
    </div>`;
  document.body.appendChild(overlay);
  return overlay;
}

function startGrab(winAmount) {
  phase = "grabbing";
  setRollBtn("...", true);
  play(sound.win);
  setSpeech(pick(LINES.comeWin));

  if (grabTimer) clearInterval(grabTimer);

  const overlay = makeGrabOverlay(winAmount);
  const timerEl = overlay.querySelector("#grabTimer");
  const btn = overlay.querySelector("#grabBtn");
  let timeLeft = 12;

  const tick = () => {
    timeLeft -= 0.1;
    timerEl.textContent = Math.ceil(timeLeft);
    timerEl.classList.toggle("low", timeLeft <= 3);
    if (timeLeft <= 0) {
      clearInterval(grabTimer);
      grabTimer = null;
      snatch(overlay, winAmount);
    }
  };
  grabTimer = setInterval(tick, 100);

  btn.addEventListener("click", () => {
    if (phase !== "grabbing" || !overlay.isConnected || timeLeft <= 0) return;
    phase = "claiming";
    if (grabTimer) clearInterval(grabTimer);
    grabTimer = null;
    overlay.remove();
    grab(winAmount);
  });

  window.__abortGrab = () => {
    if (grabTimer) clearInterval(grabTimer);
    overlay.remove();
  };
}

function grab(winAmount) {
  phase = "betting";
  point = 0;
  els.pointText.textContent = "Point: –";
  play(sound.grab);
  balance += winAmount;
  updateBalance();
  setRollBtn("ROLL", false);
  showStatus("You grabbed it. Phil looking salty. Roll again?");
  setSpeech(pick(["DAMN. HE ACTUALLY CAUGHT IT. AIGHT, ROLL IT AGAIN.", "FAST HANDS FOR A BROKE DUDE. FINE. KEEP GOIN'.", "GRABBED MY MONEY, AIN'T EVEN SAY THANKS. ROLL!"]));
}

function snatch(overlay, amount) {
  overlay.remove();
  phase = "snatching";
  play(sound.snatch);
  point = 0;
  els.pointText.textContent = "Point: –";
  setSpeech("WHAT WINNINGS? CHECK YOUR POCKETS! 😏");

  const flash = document.createElement("div");
  flash.className = "snatch";
  flash.innerHTML = `<div class="card">UH-OH! PHIL WAS FASTER THAN YOU<br>AND GRABBED YOUR WINNINGS! 💸</div>`;
  document.body.appendChild(flash);

  setTimeout(() => {
    flash.remove();
    // The unclaimed winnings were never added to balance, so there is
    // nothing to deduct. Phil snatches only the unclaimed prize.
    updateBalance();
    setBetDisplay();
    showStatus("Phil grabbed your winnings. Check your pockets. Roll again?");
    setRollBtn("ROLL", false);
    phase = "betting";
  }, 2600);
}

function loseBet() {
  phase = "betting";
  point = 0;
  els.pointText.textContent = "Point: –";
  balance -= bet;
  updateBalance();
  if (bet > balance && balance >= 10) bet = Math.floor(balance / 10) * 10;
  setBetDisplay();
  play(sound.lose);
  setRollBtn("ROLL", false);
  showStatus("Bet's gone. Phil's pockets got heavier.");
  if (balance < 10) {
    gameOver();
  }
}

function gameOver() {
  phase = "gameover";
  setRollBtn("...", true);
  setSpeech("BROKE?! GOOD. THAT MEANS I WIN. GET OUT MY CIRCLE.");

  const overlay = document.createElement("div");
  overlay.className = "grab-overlay";
  overlay.innerHTML = `
    <div class="grab-card gameover">
      <div class="big">💸</div>
      <h2>YOU'RE BROKE, SHORTY</h2>
      <p class="go-sub">PHIL TOOK EVERYTHING. GAME OVER.</p>
      <button class="grab-btn" id="playAgainBtn">PLAY AGAIN 😤</button>
    </div>`;
  document.body.appendChild(overlay);

  overlay.querySelector("#playAgainBtn").addEventListener("click", () => {
    overlay.remove();
    balance = 100;
    bet = 30;
    point = 0;
    els.pointText.textContent = "Point: –";
    updateBalance();
    setBetDisplay();
    setRollBtn("🎲 SHOOT THE DICE!", false);
    phase = "betting";
    setSpeech(pick(LINES.intro));
    showStatus("Fresh $100. Don't lose it this time.");
  });
}

function roll() {
  if (phase !== "betting") return;
  if (grabTimer) return;
  if (bet > balance) {
    setSpeech("YOU WANNA BET MORE THAN YOU GOT?! CHECK YOUR POCKETS, BROKE.");
    showStatus("Your bet's higher than what you actually carry.");
    return;
  }

  phase = "rolling";
  setRollBtn("...", true);
  play(sound.roll);

  let frames = 0;
  const spin = setInterval(() => {
    const a = 1 + Math.floor(Math.random() * 6);
    const b = 1 + Math.floor(Math.random() * 6);
    setDice(a, b, true);
    frames++;
    if (frames > 10) {
      clearInterval(spin);
      resolve(1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6));
    }
  }, 80);
}

function resolve(a, b) {
  setDice(a, b, false);
  const total = a + b;

  if (point === 0) {
    if (total === 7 || total === 11) {
      setSpeech(pick(LINES.comeWin));
      const winnings = bet;
      startGrab(winnings);
      return;
    }
    if (total === 2 || total === 3 || total === 12) {
      play(sound.lose);
      setSpeech(pick(LINES.comeLose));
      loseBet();
      return;
    }
    point = total;
    els.pointText.textContent = "Point: " + point;
    els.pointText.classList.add("flash");
    setTimeout(() => els.pointText.classList.remove("flash"), 1200);
    setRollBtn("ROLL", false);
    phase = "betting";
    showStatus(`✦ NO WIN, NO LOSS — POINT ESTABLISHED: ${point}. ROLL AGAIN: hit ${point} before a 7. ✦`);
    setSpeech(pick(LINES.rollAgain));
    return;
  }

  if (total === point) {
    setSpeech(pick(LINES.pointHit));
    const winnings = bet;
    startGrab(winnings);
    return;
  }
  if (total === 7) {
    play(sound.lose);
    setSpeech(pick(LINES.point7));
    loseBet();
    return;
  }
  setRollBtn("ROLL", false);
  phase = "betting";
  showStatus(`Rolled ${total}. Point's still ${point}.`);
  setSpeech(pick(["KEEP ROLLIN'. HIT THAT POINT BEFORE SEVEN.", "AIN'T NEITHER. AGAIN! ROLL!", "STILL ALIVE. ROLL IT."]));
};

// wire up buttons
els.shootBtn.addEventListener("click", roll);

els.betSlider.addEventListener("input", () => {
  if (phase !== "betting") return;
  bet = parseInt(els.betSlider.value, 10) || 10;
  setBetDisplay();
});

// init
updateBalance();
setDice(2, 1, false);
setBetDisplay();
setSpeech(pick(LINES.intro));
