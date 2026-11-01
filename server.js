require("dotenv").config();

const express = require("express");
const Stripe = require("stripe");

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const SITE_URL = "https://kymaxi-png.github.io/maness63";
const ALLOWED_ORIGIN = "https://kymaxi-png.github.io";

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json());

app.post("/create-checkout-session", async (req, res) => {
  try {
    if (req.body.prestation !== "consultation") {
      return res.status(400).json({ error: "Prestation inconnue" });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{
        price_data: {
          currency: "eur",
          product_data: { name: "Consultation Carrelagevisio" },
          unit_amount: 4000
        },
        quantity: 1
      }],
      success_url: `${SITE_URL}/public/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/public/cancel.html`
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Erreur lors de la création du paiement"
    });
  }
});

const PORT = process.env.PORT || 4242;

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
