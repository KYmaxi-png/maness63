require("dotenv").config();

const express = require("express");
const Stripe = require("stripe");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 4242;

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

app.set("trust proxy", 1);
app.use(express.json());

// Afficher la nouvelle version du site
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Charger le CSS et les photos
app.get("/style.css", (req, res) => {
  res.sendFile(path.join(__dirname, "style.css"));
});

app.use("/image", express.static(
  path.join(__dirname, "image")
));

// Pages de retour après paiement
app.get("/success.html", (req, res) => {
  res.send(`
    <h1>Merci pour votre paiement !</h1>
    <p>Votre paiement a été transmis.</p>
    <a href="/">Retour à CarrelageVisio</a>
  `);
});

app.get("/cancel.html", (req, res) => {
  res.send(`
    <h1>Paiement annulé</h1>
    <p>Vous pouvez revenir à votre projet.</p>
    <a href="/">Retour à CarrelageVisio</a>
  `);
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Conservation du paiement Stripe
const prestations = {
  consultation: {
    nom: "Consultation",
    montant: 4000
  }
};

app.post("/create-checkout-session", async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({
        error: "Stripe n'est pas configuré."
      });
    }

    const prestation = prestations[req.body.prestation];

    if (!prestation) {
      return res.status(400).json({
        error: "Prestation inconnue."
      });
    }

    const baseUrl =
      process.env.APP_BASE_URL ||
      `${req.protocol}://${req.get("host")}`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{
        price_data: {
          currency: "eur",
          product_data: {
            name: prestation.nom
          },
          unit_amount: prestation.montant
        },
        quantity: 1
      }],
      success_url:
        `${baseUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/cancel.html`
    });

    res.json({ url: session.url });

  } catch (error) {
    console.error("Erreur Stripe :", error.message);

    res.status(500).json({
      error: "Erreur lors de la création du paiement."
    });
  }
});

// Démarrage compatible avec Render
app.listen(PORT, "0.0.0.0", () => {
  console.log(`CarrelageVisio démarré sur le port ${PORT}`);
});

