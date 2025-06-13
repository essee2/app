const { WebcastPushConnection } = require('tiktok-live-connector');
const pkDancerName = document.getElementById("pkDancerName");


const pkScoreElement = document.getElementById("pkScore");
const pkFillElement = document.getElementById("pkFill");
const PK_MAX_SCORE = 10000;

function updatePkBar(score) {
  const cappedScore = Math.min(score, PK_MAX_SCORE);
  const fillPercent = (cappedScore / PK_MAX_SCORE) * 100;

  pkScoreElement.textContent = cappedScore + " pts";
  pkFillElement.style.width = fillPercent + "%";
}



let timerInterval = null;
let timerSeconds = 0;
let timerPanelName = null;

let connection;
let activeDancerElement = null;
const eliminatedDancers = new Set();

document.getElementById('connectBtn').addEventListener('click', async () => {
  const usernameInput = document.getElementById('usernameInput');
  const statusEl = document.getElementById('status');
  const username = usernameInput.value.trim();

  if (!username) {
    statusEl.textContent = 'Please enter a username ⚠️';
    return;
  }

  statusEl.textContent = 'Connecting...';

  connection = new WebcastPushConnection(username);

  try {
    const state = await connection.connect();
    statusEl.textContent = 'Connected ✅';
    console.log(`Connected to roomId: ${state.roomId}`);
  } catch (err) {
    statusEl.textContent = 'Connection Failed 💀';
    console.error('Connection error:', err);
    return;
  }

  connection.on('disconnected', () => {
    statusEl.textContent = 'Disconnected 🔌';
  });

  // At top level, store processed gifts to avoid duplicates
const processedGifts = new Set();

connection.on('gift', data => {
  const sender = data.uniqueId;
  const giftId = data.giftId;
  const giftName = data.giftName || 'Unknown Gift';
  const iconUrl = data.giftPictureUrl || '';
  const profilePic = data.profilePictureUrl || 'default-profile.png';
  const coinValue = data.diamondCount || 0;
  const quantity = data.repeatCount || 1;
  const totalValue = coinValue * quantity;

  // Logic:
  // 1. If it's a solo gift, show it
  // 2. If it's a combo, only show at the end
  const isCombo = quantity > 1;

  if (isCombo && !data.repeatEnd) {
    return; // wait until user finishes tapping
  }

  const giftFeed = document.getElementById('giftFeed');
  const item = document.createElement('div');
  item.className = 'gift-item';

  item.innerHTML = `
    <div class="gifter-info">
      <img src="${profilePic}" alt="profile" class="gifter-pfp" />
      <strong>${sender}</strong>
    </div>
    <div class="gift-display">
      <img src="${iconUrl}" alt="gift icon" class="gift-icon" />
      <div class="gift-info">
        sent <span>${giftName}</span> ×${quantity}<br>
        <small>Value: ${totalValue} coins</small>
      </div>
    </div>
  `;

  // Show newest gift on top
  giftFeed.insertBefore(item, giftFeed.firstChild);

  // Score update logic
  if (activeDancerElement && !eliminatedDancers.has(activeDancerElement)) {
    const scoreLabel = activeDancerElement.querySelector('.score');
    let currentScore = parseInt(activeDancerElement.dataset.score || '0');
    currentScore += totalValue;
    activeDancerElement.dataset.score = currentScore;
    scoreLabel.textContent = `${currentScore} pts`;
    updatePkBar(currentScore);
    updateRankingList();
  }
});


  connection.on('chat', data => {
    appendComment(`💬 ${data.uniqueId}: ${data.comment}`);
  });

  connection.on('member', data => {
    appendComment(`👤 ${data.uniqueId} joined the live`);
  });

  connection.on('like', data => {
    appendComment(`❤️ ${data.uniqueId} sent ${data.likeCount} likes`);
  });
});

function appendComment(message) {
  const commentFeed = document.getElementById('commentFeed');
  const div = document.createElement('div');
  div.textContent = message;
  commentFeed.appendChild(div);

  if (commentFeed.childNodes.length > 50) {
    commentFeed.removeChild(commentFeed.firstChild);
  }

  commentFeed.scrollTop = commentFeed.scrollHeight;
}

const dancerList = document.getElementById('dancerList');
const addBtn = document.getElementById('addDancerBtn');
const removeBtn = document.getElementById('removeDancerBtn');

let dancerCount = 0;

addBtn.addEventListener('click', () => {
  if (dancerCount >= 10) return;

  dancerCount++;

  const dancerEntry = document.createElement('div');
  dancerEntry.className = 'dancer-entry fade-in';
  dancerEntry.dataset.score = 0;

  const triggerBtn = document.createElement('button');
triggerBtn.textContent = '⚡';
triggerBtn.className = 'trigger-btn';
triggerBtn.addEventListener('click', () => {
  if (eliminatedDancers.has(dancerEntry)) return;

  const nameInputValue = nameInput.value;

  // If clicking the same active dancer, deactivate
  if (activeDancerElement === dancerEntry) {
    dancerEntry.classList.remove('active-dancer');
    activeDancerElement = null;
    pkDancerName.textContent = 'No active dancer'; // ⛔ Clear dancer name
    updatePkBar(0);
  } else {
    // Switch to new active dancer
    if (activeDancerElement) {
      activeDancerElement.classList.remove('active-dancer');
    }

    dancerEntry.classList.add('active-dancer');
    activeDancerElement = dancerEntry;

    pkDancerName.textContent = nameInputValue; // ✅ Show new dancer name

    const currentScore = parseInt(dancerEntry.dataset.score || '0');
    updatePkBar(currentScore);
  }
});
  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.className = 'editable-name';
  nameInput.value = `Dancer ${dancerCount}`;

  const scoreLabel = document.createElement('div');
scoreLabel.className = 'score';
scoreLabel.contentEditable = true;
scoreLabel.textContent = '0 ';

// Save and sync score from leaderboard
const saveLeaderboardScore = () => {
  let raw = scoreLabel.textContent.replace(/[^\d\-]/g, '').trim();
  let num = parseInt(raw, 10);

  if (!isNaN(num)) {
    dancerEntry.dataset.score = num;
    scoreLabel.textContent = `${num} `;

    if (activeDancerElement === dancerEntry) {
      updatePkBar(num);
    }

    updateRankingList();
  } else {
    scoreLabel.textContent = dancerEntry.dataset.score + ' ';
  }
};

scoreLabel.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    saveLeaderboardScore();
    scoreLabel.blur();
  }
});
scoreLabel.addEventListener('blur', saveLeaderboardScore);


  const eliminateBtn = document.createElement('button');
eliminateBtn.className = 'eliminate-btn';
eliminateBtn.title = 'Eliminate';
eliminateBtn.innerHTML = '<i data-lucide="x-circle"></i>';
// Eliminate button click
eliminateBtn.addEventListener('click', () => {
  if (eliminatedDancers.has(dancerEntry)) {
    // Un-eliminate dancer
    eliminatedDancers.delete(dancerEntry);
    dancerEntry.classList.remove('eliminated', 'fade-out');  // remove styles
    eliminateBtn.title = 'Eliminate';
  } else {
    // Eliminate dancer
    eliminatedDancers.add(dancerEntry);

    // Remove active state if this dancer is active
    if (activeDancerElement === dancerEntry) {
      activeDancerElement = null;
      pkDancerName.textContent = 'No active dancer';
      updatePkBar(0);
    }

    dancerEntry.classList.add('eliminated', 'fade-out'); // add styles
    eliminateBtn.title = 'Un-Eliminate';
  }
  updateRankingList();
});



  dancerEntry.appendChild(triggerBtn);
  dancerEntry.appendChild(nameInput);
  dancerEntry.appendChild(scoreLabel);
  dancerEntry.appendChild(eliminateBtn);
  dancerList.appendChild(dancerEntry);

  updateRankingList();
});

removeBtn.addEventListener('click', () => {
  if (dancerCount > 0) {
    if (dancerList.lastChild === activeDancerElement) {
      activeDancerElement = null;
    }
    eliminatedDancers.delete(dancerList.lastChild);
    dancerList.lastChild.remove();
    dancerCount--;
    updateRankingList();
  }
});

function updateRankingList() {
  const rankingList = document.getElementById('rankingList');
  rankingList.innerHTML = '';

  const dancers = Array.from(dancerList.children).map(entry => ({
    element: entry,
    name: entry.querySelector('.editable-name').value,
    score: parseInt(entry.dataset.score || '0'),
    eliminated: eliminatedDancers.has(entry)
  }));

  // Sort: non-eliminated first, then by score descending
  dancers.sort((a, b) => {
    if (a.eliminated && !b.eliminated) return 1;
    if (!a.eliminated && b.eliminated) return -1;
    return b.score - a.score;
  });

  dancers.forEach((dancer, index) => {
  const rankEntry = document.createElement('div');
  rankEntry.className = 'ranking-entry';
  if (dancer.eliminated) rankEntry.classList.add('eliminated');

  const icon = dancer.eliminated
    ? '💀'
    : ['👑', '🥈', '🥉'][index] || `#${index + 1}`;

  const iconSpan = document.createElement('span');
  iconSpan.className = 'rank-icon';
  iconSpan.textContent = icon;

  const nameSpan = document.createElement('span');
  nameSpan.className = 'rank-name';
  nameSpan.textContent = dancer.name;

  const scoreSpan = document.createElement('span');
  scoreSpan.className = 'rank-score score';
  scoreSpan.contentEditable = true;
  scoreSpan.textContent = dancer.score.toString();

  // Save function with better validation
  const saveScore = () => {
    const raw = scoreSpan.textContent.trim();
    const num = parseInt(raw, 10);

    if (!isNaN(num)) {
      dancer.score = num;
      scoreSpan.textContent = num.toString(); // Prevents non-numeric residue
    } else {
      dancer.score = 0;
      scoreSpan.textContent = '0';
    }
  };

  // Prevent Enter from inserting new lines and save on blur or Enter
  scoreSpan.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // avoid newline
      saveScore();
      scoreSpan.blur();
    }
  });

  scoreSpan.addEventListener('blur', saveScore);

  rankEntry.appendChild(iconSpan);
  rankEntry.appendChild(nameSpan);
  rankEntry.appendChild(scoreSpan);

  rankingList.appendChild(rankEntry);
});





  lucide.createIcons();
}
function makeDraggable(element) {
  let offsetX = 0;
  let offsetY = 0;
  let isDragging = false;

  element.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.clientX - element.getBoundingClientRect().left;
    offsetY = e.clientY - element.getBoundingClientRect().top;
    document.body.style.userSelect = 'none'; // prevent text selection
  });

  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      element.style.left = `${e.clientX - offsetX}px`;
      element.style.top = `${e.clientY - offsetY}px`;
    }
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
    document.body.style.userSelect = ''; // re-enable text selection
  });
}

const pkWrapper = document.getElementById('pkWrapper');
let isDragging = false;
let offsetX = 0;
let offsetY = 0;

pkWrapper.addEventListener('mousedown', (e) => {
  if (e.target.closest('button')) return;
  isDragging = true;
  offsetX = e.clientX - pkWrapper.offsetLeft;
  offsetY = e.clientY - pkWrapper.offsetTop;
});

document.addEventListener('mousemove', (e) => {
  if (isDragging) {
    pkWrapper.style.left = `${e.clientX - offsetX}px`;
    pkWrapper.style.top = `${e.clientY - offsetY}px`;
  }
});

document.addEventListener('mouseup', () => {
  isDragging = false;
});


document.getElementById('startBtn').addEventListener('click', () => {
  startTimer(); // your logic
});

document.getElementById('stopBtn').addEventListener('click', () => {
  stopTimer(); // your logic
});
function updatePkBar(currentScore) {
  const pkFill = document.getElementById('pkFill');
  const pkScore = document.getElementById('pkScore');
  const maxScore = 500000;
  const percent = Math.min(100, (currentScore / maxScore) * 100);
  pkFill.style.width = `${percent}%`;
  pkScore.textContent = `${currentScore} `;
}





