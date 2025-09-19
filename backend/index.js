const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const usersRoutes = require("./routes/users");
const teamsRoutes = require("./routes/teams");
const inviteRoutes = require("./routes/invites");
const tournamentsRoutes = require("./routes/tournaments");
const registrationsRoutes = require("./routes/registrations");
const matchesRoutes = require("./routes/matches");
const complaintRoutes = require("./routes/complaints");
const resultsRoutes = require("./routes/results");
const leaderboardRoutes = require("./routes/leaderboard");
const discussionsRoutes = require("./routes/discussions");
const membershipsRoutes = require("./routes/memberships");
const adminRoutes = require("./routes/admin");

const app = express();

app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/users", usersRoutes);
app.use("/teams", teamsRoutes);
app.use("/invites", inviteRoutes);
app.use("/tournaments", tournamentsRoutes);
app.use("/registrations", registrationsRoutes);
app.use("/matches", matchesRoutes);
app.use("/complaints", complaintRoutes);
app.use("/results", resultsRoutes);
app.use("/leaderboard", leaderboardRoutes);
app.use("/discussions", discussionsRoutes);
app.use("/memberships", membershipsRoutes);
app.use("/admin", adminRoutes);

app.listen(4000, () => console.log("✅ Backend running on http://localhost:4000"));
