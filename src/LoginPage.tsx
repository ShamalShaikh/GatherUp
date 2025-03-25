import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css"; // Import the CSS file

function LoginPage() {
  let users = [
    ["theBold", "bruh"],
    ["Thebold", "realBruh"],
    ["TheRealBold", "okokok1212"],
  ];

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate(); //A react hook

  const validate = (event: React.FormEvent) => {
    event.preventDefault(); // Prevent page reload on form submission
    console.log("I HAVE BEEN SUMMONED");

    const exists = users.some(
      ([validUser, validPassword]) =>
        validUser === username && validPassword === password
    );
    if (exists) {
      console.log("I EXIST");
      navigate("/searchPage");
    } else {
      console.log("FUCK");
      alert("Invalid username or/and password");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">Welcome to Gather Up</h2>
        <form onSubmit={validate}>
          <div className="form-group">
            <label className="subLabel">Username</label>
            <input
              type="text"
              className="login-input"
              placeholder="Enter your username"
              value={username}
              onChange={(inputedUsername) =>
                setUsername(inputedUsername.target.value)
              }
              required
            />
          </div>
          <div className="form-group">
            <label className="subLabel">Password</label>
            <input
              type="password"
              className="login-input"
              placeholder="Enter your password"
              value={password}
              onChange={(inputedPassword) =>
                setPassword(inputedPassword.target.value)
              }
              required
            />
          </div>
          <button type="submit" className="login-button">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
