const usuario = localStorage.getItem("usuario");

// 🔒 PROTEGER ACCESO
if (!usuario) {
    window.location.href = "/pages/login.html";
}

// 🚪 LOGOUT
function logout() {
    localStorage.removeItem("usuario");
    window.location.href = "/pages/login.html";
}

// 🧠 DEBUG
console.log("Usuario activo:", JSON.parse(usuario));