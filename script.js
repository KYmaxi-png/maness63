require("dotenv").config();

const express = require("express");
const Stripe = require("stripe");
const path = require("path");

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
app.use(express.static(path.join(__dirname, "public", "public")));s

app.use(express.json());

const prestations = {
  consultation: {
    nom: "Consultation",
    montant: 4000,
  },
};

app.post("/create-checkout-session", async (req, res) => {
  try {
    const prestation = prestations[req.body.prestation];

    if (!prestation) {
      return res.status(400).json({ error: "Prestation inconnue" });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: { name: prestation.nom },
            unit_amount: prestation.montant,
          },
          quantity: 1,
        },
      ],
      success_url: "http://localhost:4242/success.html",
      cancel_url: "http://localhost:4242/cancel.html",
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Erreur lors de la création du paiement" });
  }
});

app.listen(4242, () => {
  console.log("Serveur démarré sur http://localhost:4242");
});
