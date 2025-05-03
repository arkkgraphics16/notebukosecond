// client/src/pages/UpgradePage.jsx
import React from 'react';

function UpgradePage() {
  return (
    <div className="upgrade-page">
      <h1 className="upgrade-heading">Upgrade Now</h1>
      <p className="upgrade-text">Your free trial has expired.</p>
      <p className="upgrade-text">
        Please upgrade your account to continue using our premium features.
      </p>

      {/* CHANGES TIER: Plans container with individual plan banners */}
      <div className="plans-container">
        <div className="plan-banner">
          <h2 className="plan-title">Buko Juice</h2>
          <p className="plan-items">50 items</p>
          <p className="plan-description">Mas maraming sagot sa AI.</p>
          <p className="plan-support">
            Support: Sulat ka lang sa customer support, aasikasuhin within 1–2 days.
          </p>
        </div>
        <div className="plan-banner">
          <h2 className="plan-title">Buko Shake</h2>
          <p className="plan-items">100 items</p>
          <p className="plan-description">Mas malawak na tracking.</p>
          <p className="plan-support">
            Support: Full Customer Support, Chat lang samin.
          </p>
        </div>
        <div className="plan-banner">
          <h2 className="plan-title">Buko Pandan</h2>
          <p className="plan-items">300 items</p>
          <p className="plan-description">Walang limit na AI.</p>
          <p className="plan-support">
            Support: Tawag o chat, plus priority support para walang antay‑antay.
            <br />
            Ikaw agad ang una sa mga updates at bagong features.
          </p>
        </div>
      </div>
    </div>
  );
}

export default UpgradePage;