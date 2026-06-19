import React, { useState } from 'react';
import { db } from '../utils/db';
import { Shield, User, Award, Brain, CreditCard } from 'lucide-react';

const QUIZ_QUESTIONS = [
  {
    text: "How do you feel after buying something expensive?",
    options: [
      { text: "Anxious, I immediately want to save.", type: "Fear Saver" },
      { text: "Happy, it makes me feel comforted.", type: "Comfort Buyer" },
      { text: "Guilty, but I'll do it again next weekend!", type: "Weekend Destroyer" },
      { text: "Excited, if it is a smart asset or investment.", type: "Achievement Investor" },
      { text: "Great, especially if I can show it off.", type: "Social Spender" },
      { text: "Thrilled because it was on sale or a steal!", type: "Impulse Hunter" }
    ]
  },
  {
    text: "When you get unexpected money (e.g. gift or cashback), what's your first instinct?",
    options: [
      { text: "Put it straight into my savings account.", type: "Fear Saver" },
      { text: "Buy something nice to pamper myself.", type: "Comfort Buyer" },
      { text: "Plan a big dinner or night out.", type: "Weekend Destroyer" },
      { text: "Invest it in stocks, funds or assets.", type: "Achievement Investor" },
      { text: "Treat my friends or family.", type: "Social Spender" },
      { text: "Browse online shopping for flash deals.", type: "Impulse Hunter" }
    ]
  },
  {
    text: "Your friends invite you to a luxury dinner, but you are close to your budget limit. You:",
    options: [
      { text: "Refuse immediately, saving is my priority.", type: "Fear Saver" },
      { text: "Go anyway, life is too short to miss comfort.", type: "Comfort Buyer" },
      { text: "Go and put it on credit card. Party time!", type: "Weekend Destroyer" },
      { text: "Go if it offers valuable networking opportunities.", type: "Achievement Investor" },
      { text: "Go because I don't want to miss out socially.", type: "Social Spender" },
      { text: "Go only if I can find a discount coupon!", type: "Impulse Hunter" }
    ]
  },
  {
    text: "How often do you check your bank balances?",
    options: [
      { text: "Multiple times a day, it gives me peace.", type: "Fear Saver" },
      { text: "Only when I feel stressed about money.", type: "Comfort Buyer" },
      { text: "Rarely, usually to check the weekend damage.", type: "Weekend Destroyer" },
      { text: "Daily, to track my net worth growth.", type: "Achievement Investor" },
      { text: "Only when my card gets declined.", type: "Social Spender" },
      { text: "Whenever I'm about to buy something.", type: "Impulse Hunter" }
    ]
  },
  {
    text: "What is your main financial goal right now?",
    options: [
      { text: "Emergency fund, I fear running out.", type: "Fear Saver" },
      { text: "A nice vacation or self-care treatment.", type: "Comfort Buyer" },
      { text: "Having enough to enjoy my weekends fully.", type: "Weekend Destroyer" },
      { text: "Financial independence & wealth building.", type: "Achievement Investor" },
      { text: "Hosting events or upgrading my status.", type: "Social Spender" },
      { text: "Finding the best deals and gadgets.", type: "Impulse Hunter" }
    ]
  },
  {
    text: "You see a 50% discount on a premium gadget. You:",
    options: [
      { text: "Ignore it, I don't absolutely need it.", type: "Fear Saver" },
      { text: "Buy it, I deserve a high-quality treat.", type: "Comfort Buyer" },
      { text: "Buy it to celebrate the weekend!", type: "Weekend Destroyer" },
      { text: "Research if it has good utility or resale value.", type: "Achievement Investor" },
      { text: "Buy it so I can share my reviews.", type: "Social Spender" },
      { text: "Buy it instantly, it's an incredible bargain!", type: "Impulse Hunter" }
    ]
  }
];

export default function Onboarding({ onLogin }) {
  const [username, setUsername] = useState('');
  const [step, setStep] = useState(1); // 1: Login/Username, 2: Profile Selection, 3: Quiz, 4: Results
  const [userType, setUserType] = useState('Student'); // Student or Professional
  const [creatureName, setCreatureName] = useState('Spendy');
  const [targetBudget, setTargetBudget] = useState('15000');
  const [answers, setAnswers] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [dnaResult, setDnaResult] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) return;

    const lowerName = username.trim().toLowerCase();
    const existingUser = await db.users.get(lowerName);

    if (existingUser) {
      onLogin(existingUser);
    } else {
      setStep(2);
    }
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    setStep(3);
  };

  const handleAnswerSelect = (type) => {
    const updatedAnswers = [...answers, type];
    setAnswers(updatedAnswers);

    if (currentQuestion < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Calculate DNA personality
      const counts = {};
      let maxType = updatedAnswers[0];
      let maxCount = 0;

      updatedAnswers.forEach((val) => {
        counts[val] = (counts[val] || 0) + 1;
        if (counts[val] > maxCount) {
          maxCount = counts[val];
          maxType = val;
        }
      });

      setDnaResult(maxType);
      setStep(4);
    }
  };

  const finishOnboarding = async () => {
    const lowerName = username.trim().toLowerCase();
    const newUser = {
      id: lowerName,
      username: username.trim(),
      userType,
      creatureName,
      targetBudget: parseFloat(targetBudget) || 15000,
      moneyDna: dnaResult,
      xp: 100, // Initial onboarding bonus!
      level: 1,
      createdDate: new Date().toISOString()
    };

    // Pre-populate some starter challenges
    const initialChallenges = [
      {
        id: `${lowerName}-swiggy`,
        userId: lowerName,
        challengeName: "No Swiggy / Ordering Out",
        startDate: new Date().toISOString(),
        durationDays: 7,
        xpReward: 100,
        progressDays: [false, false, false, false, false, false, false],
        completed: false,
        active: true
      },
      {
        id: `${lowerName}-budget-warrior`,
        userId: lowerName,
        challengeName: "Stay Under Daily Limit",
        startDate: new Date().toISOString(),
        durationDays: 5,
        xpReward: 150,
        progressDays: [false, false, false, false, false],
        completed: false,
        active: false
      }
    ];

    await db.users.put(newUser);
    for (const c of initialChallenges) {
      await db.challenges.put(c);
    }

    onLogin(newUser);
  };

  return (
    <div className="onboarding-container">
      {step === 1 && (
        <form onSubmit={handleLoginSubmit} className="onboarding-card glass-panel animate-slide-in">
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div className="brand-logo animate-float" style={{ margin: '0 auto 16px auto', width: '48px', height: '48px' }}>
              <Shield size={24} color="#fff" />
            </div>
            <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>Welcome to FinQuest</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Log in or create a free profile instantly</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Username / Profile Key</label>
              <input
                type="text"
                placeholder="e.g. alex_finance"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="glass-input"
                required
              />
            </div>
            <button type="submit" className="glass-btn">
              Let's Begin
            </button>
          </div>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleProfileSubmit} className="onboarding-card glass-panel animate-slide-in">
          <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>Setup Your Profile</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Tailor the app specifically to your lifestyle</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Are you a Student or Professional?</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  className={`glass-btn-secondary ${userType === 'Student' ? 'active' : ''}`}
                  onClick={() => setUserType('Student')}
                  style={{ flexGrow: 1, borderColor: userType === 'Student' ? 'var(--color-primary)' : '' }}
                >
                  Student
                </button>
                <button
                  type="button"
                  className={`glass-btn-secondary ${userType === 'Professional' ? 'active' : ''}`}
                  onClick={() => setUserType('Professional')}
                  style={{ flexGrow: 1, borderColor: userType === 'Professional' ? 'var(--color-primary)' : '' }}
                >
                  Professional
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Name your Financial Discipline Creature</label>
              <input
                type="text"
                value={creatureName}
                onChange={(e) => setCreatureName(e.target.value)}
                className="glass-input"
                required
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Monthly Budget Goal (₹)</label>
              <input
                type="number"
                value={targetBudget}
                onChange={(e) => setTargetBudget(e.target.value)}
                className="glass-input"
                required
              />
            </div>

            <button type="submit" className="glass-btn">
              Continue to Money DNA Quiz
            </button>
          </div>
        </form>
      )}

      {step === 3 && (
        <div className="onboarding-card glass-panel animate-slide-in" style={{ maxWidth: '560px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: 'bold' }}>MONEY DNA QUIZ</span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Q {currentQuestion + 1} of {QUIZ_QUESTIONS.length}</span>
          </div>

          <div className="progress-bar-container" style={{ marginBottom: '24px', height: '4px' }}>
            {QUIZ_QUESTIONS.map((_, i) => (
              <div
                key={i}
                className="progress-segment"
                style={{ background: i <= currentQuestion ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)' }}
              />
            ))}
          </div>

          <h2 style={{ fontSize: '20px', marginBottom: '24px', lineHeight: '1.4' }}>{QUIZ_QUESTIONS[currentQuestion].text}</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {QUIZ_QUESTIONS[currentQuestion].options.map((opt, i) => (
              <div
                key={i}
                className="quiz-option"
                onClick={() => handleAnswerSelect(opt.type)}
              >
                {opt.text}
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="onboarding-card glass-panel animate-slide-in" style={{ textAlign: 'center', maxWidth: '500px' }}>
          <div className="brand-logo animate-float" style={{ margin: '0 auto 20px auto', width: '64px', height: '64px', background: 'linear-gradient(135deg, var(--color-success), #059669)' }}>
            <Award size={32} color="#fff" />
          </div>
          <h2 style={{ fontSize: '26px', marginBottom: '12px' }}>DNA Test Complete!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Based on your answers, your financial personality archetype is:</p>
          
          <div
            className="glass-panel"
            style={{
              padding: '24px',
              background: 'var(--color-primary-glow)',
              borderColor: 'var(--color-primary)',
              borderRadius: '16px',
              marginBottom: '32px'
            }}
          >
            <h3 style={{ fontSize: '24px', color: '#fff', marginBottom: '8px' }}>{dnaResult}</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              {dnaResult === "Fear Saver" && "You prioritize safety above all. You check balance sheets regularly and save to ward off anxiety, but sometimes forget to enjoy your earnings."}
              {dnaResult === "Comfort Buyer" && "You tend to seek immediate stress relief or happiness through shopping. Buying new items comforts you, but can strain budgets."}
              {dnaResult === "Weekend Destroyer" && "You are extremely disciplined during the week, only to blow your budget on weekend dinners, parties, or recreation."}
              {dnaResult === "Achievement Investor" && "You view money as a strategic scorecard. You love seeing savings grow and researching investments or assets."}
              {dnaResult === "Social Spender" && "Money is a way for you to connect with friends, host dinners, purchase gifts, and show social alignment."}
              {dnaResult === "Impulse Hunter" && "You are drawn to discounts, sales, and bargains. You feel you save money by spending on deals, even for items you don't need."}
            </p>
          </div>

          <button onClick={finishOnboarding} className="glass-btn" style={{ width: '100%' }}>
            Enter FinQuest Portal
          </button>
        </div>
      )}
    </div>
  );
}
