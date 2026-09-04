/* =========================================================
   NAV LOGIN STATE
========================================================= */

(function syncNavAuthState(){
  const loginLink = document.querySelector('.link-login');
  if (!loginLink) return;

  const isLoggedIn = sessionStorage.getItem('fundedappleLoggedIn') === 'true';

  if (isLoggedIn) {
    loginLink.textContent = 'Dashboard';
    loginLink.href = 'dashboard.html';
  }
})();


function sendChatAsEmail(){
  const input = document.getElementById('chatMsgInput');
  const msg = encodeURIComponent(input.value || '');
  window.location.href = `mailto:support@fundedapple.com?subject=Question%20from%20site%20chat&body=${msg}`;
}


/* =========================================================
   COUNTER ANIMATION
========================================================= */

function animateCounters(){

  document.querySelectorAll('[data-target]').forEach(el=>{

    const target = parseFloat(el.dataset.target);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const dur = 1400;
    const start = performance.now();

    function tick(now){

      const p = Math.min(1,(now-start)/dur);
      const eased = 1 - Math.pow(1-p,3);
      const val = Math.floor(target*eased);

      el.textContent =
        prefix +
        val.toLocaleString() +
        suffix;

      if(p<1){
        requestAnimationFrame(tick);
      }

    }

    requestAnimationFrame(tick);

  });

}


const heroObserver = new IntersectionObserver((entries)=>{

  entries.forEach(e=>{

    if(e.isIntersecting){

      animateCounters();

      heroObserver.disconnect();

    }

  });

},{threshold:0.4});


const statRow = document.querySelector('.stat-row');

if(statRow){
  heroObserver.observe(statRow);
}


/* =========================================================
   CONFIGURATOR STATE
========================================================= */

const tabs = document.querySelectorAll('.model-card');
const configOuter = document.getElementById('configOuter');

const platformOptions = document.querySelectorAll('.platform-option');
const platformCta = document.getElementById('platformCta');

platformOptions.forEach(option=>{
  option.addEventListener('click',()=>{
    platformOptions.forEach(item=>{
      item.classList.remove('active');
      item.setAttribute('aria-selected','false');
      item.querySelector('em').textContent = 'Choose';
    });
    option.classList.add('active');
    option.setAttribute('aria-selected','true');
    option.querySelector('em').textContent = 'Selected';
    if(platformCta){
      platformCta.childNodes[0].textContent = `Use ${option.dataset.platform} for my challenge `;
    }
  });
});

let currentTrack = 'two';
let currentSize = 25000;
let currentRulePanel = 'challenge';

const savePlanBtn = document.getElementById('savePlanBtn');
const savePlanLabel = document.getElementById('savePlanLabel');

if(savePlanBtn){
  savePlanBtn.addEventListener('click',()=>{
    localStorage.setItem('fundedappleSavedPlan',JSON.stringify({track:currentTrack,size:currentSize,savedAt:new Date().toISOString()}));
    savePlanBtn.setAttribute('aria-pressed','true');
    savePlanLabel.textContent = 'Setup saved';
  });
}


/* =========================================================
   ACCOUNT SIZES
========================================================= */

const sizesByTrack = {

  two:[
    5000,
    10000,
    25000,
    50000,
    100000,
    200000
  ],

  one:[
    5000,
    10000,
    25000,
    50000,
    100000,
    200000
  ],

  blitz:[
    5000,
    10000,
    25000,
    50000,
    100000
  ],

  instant:[
    5000,
    10000,
    25000,
    50000
  ]

};

try{
  const savedPlan = JSON.parse(localStorage.getItem('fundedappleSavedPlan') || 'null');
  if(savedPlan && sizesByTrack[savedPlan.track] && sizesByTrack[savedPlan.track].includes(Number(savedPlan.size))){
    currentTrack = savedPlan.track;
    currentSize = Number(savedPlan.size);
  }
}catch(error){
  localStorage.removeItem('fundedappleSavedPlan');
}

tabs.forEach(tab=>{
  tab.classList.toggle('active',tab.dataset.track===currentTrack);
});


/* =========================================================
   RULE INFORMATION
========================================================= */

const ruleTooltips = {

  'Phase 1 profit target':
    'The % gain required to pass phase 1 of your evaluation.',

  'Phase 2 profit target':
    'The % gain required to pass phase 2 of your evaluation.',

  'Profit target':
    'The % gain required to pass your evaluation.',

  'Challenge':
    'Whether an evaluation phase is required before you get funded.',

  'Daily loss limit':
    'Maximum loss allowed in a single trading day before the account breaches.',

  'Max drawdown':
    'Maximum total loss allowed from your starting balance at any point.',

  'Drawdown type':
    '"Static" means the drawdown floor is fixed to your starting balance and does not trail your equity up.',

  'Min trading days':
    'Minimum number of separate days you must trade before you can pass.',

  'News trading':
    'Whether you can hold or open trades during high-impact news events.',

  'Reset applicable':
    'Whether you can reset a failed evaluation instead of buying a new one.',

  'Profit split':
    'Your share of the profits once you are trading a funded account.',

  'First withdrawal':
    'How soon after being funded you can request your first payout.',

  'Subsequent withdrawals':
    'How often you can request payouts after your first one.',

  'Refundable fee':
    'Your evaluation fee is credited back to you once this condition is met.',

  'Activation fee':
    'The one-time fee to activate an Instant funded account.',

  'Payout guarantee':
    'We pay within this window or credit you $1,000 automatically — no claim form.',

  'Max risk per trade':
    'Maximum % of account equity you can risk on a single open trade.',

  'Weekend holding':
    'Whether you can hold open positions over the weekend.'

};


/* =========================================================
   RULES FOR EACH MODEL
========================================================= */

const rulesByTrack = {

  two:{

    challenge:[

      {
        l:'Phase 1 profit target',
        v:'8%'
      },

      {
        l:'Phase 2 profit target',
        v:'5%'
      },

      {
        l:'Daily loss limit',
        v:'5%'
      },

      {
        l:'Max drawdown',
        v:'10%'
      },

      {
        l:'Drawdown type',
        v:'Static'
      },

      {
        l:'Min trading days',
        v:'4 days'
      },

      {
        l:'News trading',
        v:'Allowed'
      },

      {
        l:'Reset applicable',
        v:'Yes'
      }

    ],

    funded:[

      {
        l:'Profit split',
        v:'Up to 90%'
      },

      {
        l:'First withdrawal',
        v:'14 days'
      },

      {
        l:'Subsequent withdrawals',
        v:'Every 14 days'
      },

      {
        l:'Refundable fee',
        v:'Yes, on 1st payout'
      },

      {
        l:'Payout guarantee',
        v:'12 hours'
      },

      {
        l:'Max risk per trade',
        v:'3% at any time'
      },

      {
        l:'Weekend holding',
        v:'Allowed'
      }

    ]

  },


  one:{

    challenge:[

      {
        l:'Profit target',
        v:'10%'
      },

      {
        l:'Daily loss limit',
        v:'4%'
      },

      {
        l:'Max drawdown',
        v:'6%'
      },

      {
        l:'Drawdown type',
        v:'Static'
      },

      {
        l:'Min trading days',
        v:'4 days'
      },

      {
        l:'News trading',
        v:'Restricted'
      },

      {
        l:'Reset applicable',
        v:'Yes'
      }

    ],

    funded:[

      {
        l:'Profit split',
        v:'80% start, scales to 90%'
      },

      {
        l:'First withdrawal',
        v:'14 days'
      },

      {
        l:'Subsequent withdrawals',
        v:'Every 14 days'
      },

      {
        l:'Refundable fee',
        v:'Yes, on 1st payout'
      },

      {
        l:'Payout guarantee',
        v:'12 hours'
      },

      {
        l:'Max risk per trade',
        v:'3% at any time'
      },

      {
        l:'Weekend holding',
        v:'Allowed'
      }

    ]

  },


  blitz:{

    challenge:[

      {
        l:'Profit target',
        v:'6% in 3 days'
      },

      {
        l:'Daily loss limit',
        v:'4%'
      },

      {
        l:'Max drawdown',
        v:'8%'
      },

      {
        l:'Drawdown type',
        v:'Static'
      },

      {
        l:'Min trading days',
        v:'2 days'
      },

      {
        l:'News trading',
        v:'Allowed'
      },

      {
        l:'Reset applicable',
        v:'Yes'
      }

    ],

    funded:[

      {
        l:'Profit split',
        v:'Up to 85%'
      },

      {
        l:'First withdrawal',
        v:'7 days'
      },

      {
        l:'Subsequent withdrawals',
        v:'Every 7 days'
      },

      {
        l:'Refundable fee',
        v:'Yes, on 1st payout'
      },

      {
        l:'Payout guarantee',
        v:'12 hours'
      },

      {
        l:'Max risk per trade',
        v:'4% at any time'
      },

      {
        l:'Weekend holding',
        v:'Allowed'
      }

    ]

  },


  instant:{

    challenge:[

      {
        l:'Challenge',
        v:'None — instant funding'
      },

      {
        l:'Daily loss limit',
        v:'3%'
      },

      {
        l:'Max drawdown',
        v:'5%'
      },

      {
        l:'Drawdown type',
        v:'Static'
      },

      {
        l:'News trading',
        v:'Restricted'
      }

    ],

    funded:[

      {
        l:'Profit split',
        v:'75% start'
      },

      {
        l:'First withdrawal',
        v:'14 days'
      },

      {
        l:'Subsequent withdrawals',
        v:'Every 14 days'
      },

      {
        l:'Activation fee',
        v:'Non-refundable'
      },

      {
        l:'Payout guarantee',
        v:'12 hours'
      },

      {
        l:'Max risk per trade',
        v:'2% at any time'
      },

      {
        l:'Weekend holding',
        v:'Allowed'
      }

    ]

  }

};


/* =========================================================
   PRICE SYSTEM
========================================================= */

const priceMap = {

  5000:39,
  10000:69,
  25000:149,
  50000:249,
  100000:449,
  200000:849

};


const trackMultiplier = {

  two:1,
  one:0.9,
  blitz:1.15,
  instant:1.8

};


const hotTracks = [
  'blitz',
  'instant'
];


function priceFor(size, track){

  return Math.round(
    (priceMap[size] || 149) *
    (trackMultiplier[track] || 1)
  );

}


/* =========================================================
   SIZE CARDS
========================================================= */

function renderSizes(){

  const grid = document.getElementById('sizeGrid');

  if(!grid){
    return;
  }

  const isHot =
    hotTracks.includes(currentTrack);

  grid.classList.toggle(
    'hot',
    isHot
  );

  grid.innerHTML = '';


  sizesByTrack[currentTrack].forEach(size=>{

    const card =
      document.createElement('div');


    card.className =
      'size-card' +
      (size===currentSize ? ' active' : '') +
      (size===100000 ? ' popular' : '');


    const label =
      size >= 1000
        ? (size/1000) + 'K'
        : size;


    const price =
      priceFor(
        size,
        currentTrack
      );
const modelNames = {
  two: '2-Step Challenge',
  one: '1-Step Challenge',
  blitz: 'Blitz Challenge',
  instant: 'Instant Funding'
};

const priceModelName =
  document.getElementById('priceModelName');

const priceAccountName =
  document.getElementById('priceAccountName');

if(priceModelName){
  priceModelName.textContent =
    modelNames[currentTrack] || 'Challenge';
}

if(priceAccountName){
  priceAccountName.textContent =
    '$' + (currentSize / 1000) + 'K Account';
}


    card.innerHTML = `

      <div class="sc-amount">
        $${label}
      </div>

      <div class="sc-price mono">
        $${price}
      </div>

    `;


    card.addEventListener(
      'click',
      ()=>{

        currentSize = size;

        renderSizes();

        renderRules();

      }
    );


    grid.appendChild(card);

  });

}


/* =========================================================
   RULE LIST BUILDER
========================================================= */

function buildRuleList(items){

  return items.map(r=>{

    const tip =
      ruleTooltips[r.l] || '';


    return `

      <div
        class="rule-line"
        data-rule-name="${r.l}"
        data-rule-value="${r.v}"
      >

        <span class="rl">

          <button
            type="button"
            class="rule-info"
            data-rule="${r.l}"
            data-value="${r.v}"
            aria-label="More information about ${r.l}"
            title="${tip}"
          >
            i
          </button>

          ${r.l}

        </span>

        <span class="rv">
          ${r.v}
        </span>

      </div>

    `;

  }).join('');

}


/* =========================================================
   RENDER RULES + PRICE
========================================================= */

function renderRules(){

  const rulesPanel =
    document.getElementById(
      'rulesPanelSingle'
    );

  if(!rulesPanel){
    return;
  }


  const r =
    rulesByTrack[currentTrack];


  const items =
    currentRulePanel === 'challenge'
      ? r.challenge
      : r.funded;


  rulesPanel.innerHTML =
    buildRuleList(items);


  /* ---------- PRICE ---------- */

  const price =
    priceFor(
      currentSize,
      currentTrack
    );


  const priceEl =
    document.getElementById(
      'priceOut'
    );


  if(priceEl){

    priceEl.textContent =
      '$' + price;

  }


  /* ---------- HOT MODEL ---------- */

  const isHot =
    hotTracks.includes(
      currentTrack
    );


  if(configOuter){

    configOuter.classList.toggle(
      'hot',
      isHot
    );

  }


  if(priceEl){

    priceEl.classList.toggle(
      'hot',
      isHot
    );

  }


  /* ---------- PRICE NOTE ---------- */

  const priceNote =
    document.getElementById(
      'priceNote'
    );


  if(priceNote){

    priceNote.textContent =
      currentTrack === 'instant'

        ? 'one-time activation fee, non-refundable'

        : 'one-time, 100% refundable on first payout';

  }


  /* ---------- CHECKOUT LINK ---------- */

  const btn =
    document.getElementById(
      'getFundedBtn'
    );


  if(btn){

    btn.href =

      `checkout.html?track=${encodeURIComponent(currentTrack)}` +

      `&size=${encodeURIComponent(currentSize)}` +

      `&price=${encodeURIComponent(price)}`;

  }


  /* ---------- ADD INFO BUTTON EVENTS ---------- */

  attachRuleInfoEvents();

}


/* =========================================================
   RULE INFO POPUP
========================================================= */

function attachRuleInfoEvents(){

  const infoButtons =
    document.querySelectorAll(
      '.rule-info'
    );


  infoButtons.forEach(button=>{

    button.addEventListener(
      'click',
      function(event){

        event.preventDefault();

        event.stopPropagation();


        const ruleName =
          this.dataset.rule || 'Rule';


        const ruleValue =
          this.dataset.value || '';


        openRuleInfo(
          ruleName,
          ruleValue
        );

      }
    );

  });

}


/* =========================================================
   OPEN RULE INFO
========================================================= */

function openRuleInfo(
  ruleName,
  ruleValue
){

  const overlay =
    document.getElementById(
      'ruleInfoOverlay'
    );


  const title =
    document.getElementById(
      'ruleInfoTitle'
    );


  const value =
    document.getElementById(
      'ruleInfoValue'
    );


  const text =
    document.getElementById(
      'ruleInfoText'
    );


  if(!overlay){
    return;
  }


  const explanation =
    ruleTooltips[ruleName] ||

    'More information about this rule will be available soon.';


  if(title){

    title.textContent =
      ruleName;

  }


  if(value){

    value.textContent =
      ruleValue;

  }


  if(text){

    text.textContent =
      explanation;

  }


  overlay.classList.add(
    'open'
  );


  overlay.setAttribute(
    'aria-hidden',
    'false'
  );


  document.body.classList.add(
    'rule-modal-open'
  );

}


/* =========================================================
   CLOSE RULE INFO
========================================================= */

function closeRuleInfo(){

  const overlay =
    document.getElementById(
      'ruleInfoOverlay'
    );


  if(!overlay){
    return;
  }


  overlay.classList.remove(
    'open'
  );


  overlay.setAttribute(
    'aria-hidden',
    'true'
  );


  document.body.classList.remove(
    'rule-modal-open'
  );

}


/* =========================================================
   RULE TAB SWITCH
========================================================= */

const ruleTabButtons =
  document.querySelectorAll(
    '.rules-tab'
  );


ruleTabButtons.forEach(btn=>{

  btn.addEventListener(
    'click',
    ()=>{

      ruleTabButtons.forEach(b=>{

        b.classList.remove(
          'active'
        );

      });


      btn.classList.add(
        'active'
      );


      currentRulePanel =
        btn.dataset.panel;


      renderRules();

    }
  );

});


/* =========================================================
   MODEL CARD SELECTION
========================================================= */

tabs.forEach(tab=>{

  tab.addEventListener(
    'click',
    ()=>{


      tabs.forEach(t=>{

        t.classList.remove(
          'active'
        );

        t.classList.remove(
          'tab-hot'
        );

      });


      tab.classList.add(
        'active'
      );


      currentTrack =
        tab.dataset.track;


      if(
        hotTracks.includes(
          currentTrack
        )
      ){

        tab.classList.add(
          'tab-hot'
        );

      }


      if(
        !sizesByTrack[
          currentTrack
        ].includes(
          currentSize
        )
      ){

        currentSize =
          sizesByTrack[
            currentTrack
          ][2] ||

          sizesByTrack[
            currentTrack
          ][0];

      }


      renderSizes();

      renderRules();

    }
  );

});


/* =========================================================
   INITIAL CONFIGURATOR LOAD
========================================================= */

renderSizes();

renderRules();


/* =========================================================
   RULE POPUP CLOSE BUTTON
========================================================= */

const ruleInfoClose =
  document.getElementById(
    'ruleInfoClose'
  );


if(ruleInfoClose){

  ruleInfoClose.addEventListener(
    'click',
    closeRuleInfo
  );

}


/* =========================================================
   RULE POPUP — CLICK OUTSIDE
========================================================= */

const ruleInfoOverlay =
  document.getElementById(
    'ruleInfoOverlay'
  );


if(ruleInfoOverlay){

  ruleInfoOverlay.addEventListener(
    'click',
    function(event){

      if(
        event.target ===
        ruleInfoOverlay
      ){

        closeRuleInfo();

      }

    }
  );

}


/* =========================================================
   RULE POPUP — ESC KEY
========================================================= */

document.addEventListener(
  'keydown',
  function(event){

    if(
      event.key === 'Escape'
    ){

      closeRuleInfo();

    }

  }
);


/* =========================================================
   FAQ
========================================================= */

function toggleFaq(el){

  const item =
    el.parentElement;


  const wasOpen =
    item.classList.contains(
      'open'
    );


  document
    .querySelectorAll(
      '.faq-item'
    )
    .forEach(i=>{

      i.classList.remove(
        'open'
      );

    });


  if(!wasOpen){

    item.classList.add(
      'open'
    );

  }

}


/* =========================================================
   CHAT
========================================================= */

function openChat(){

  const panel =
    document.getElementById(
      'chatPanel'
    );


  if(panel){

    panel.classList.add(
      'open'
    );

  }

}


function closeChat(){

  const panel =
    document.getElementById(
      'chatPanel'
    );


  if(panel){

    panel.classList.remove(
      'open'
    );

  }

}