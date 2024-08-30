export default function handler(req, res) {
  console.log('NextAuth Log:', req.body);
  res.status(200).json({ received: true });
}
