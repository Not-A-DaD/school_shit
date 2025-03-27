async function signup() {
  let authData = undefined
    try {
      // First request: Signup
      let response = await fetch("http://127.0.0.1:2000/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          "Full_name": "Ritik",
          "username": "vihan78456",
          "email": "vi4979@gmail.com",
          "password": "9234611798@"
        })
      });
      let data = await response.json();
      if (response.status !== 200) {
        console.error("Signup failed:", data);
        return alert("Signup failed: " + (data.message || "Unknown error"));
      }
      let temp_token = data.Token;
      console.log("Received Token:", temp_token);
      if (!temp_token) {
        return alert("No token received, signup failed.");
      }
      // Second request: Email verification
      let authResponse = await fetch("http://127.0.0.1:2000/signup-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Token: temp_token })
      });
      authData = await authResponse.json();
      if (authResponse.status !== 200) {
        console.error("Verification failed:", authData);
        return alert("Verification failed: " + (authData.message || "Unknown error"));
      }
      console.log("Verification successful:", authData);
      // Redirect using the URL from the server
      // window.location.href = authData.redirectUrl;
    } catch (error) {
      console.log(authData)
      console.error("Error:", error);
      alert("An error occurred: " + error.message);
    }
  }
