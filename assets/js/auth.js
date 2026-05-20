const usuario = JSON.parse(localStorage.getItem("usuario"));


// =============================
// VALIDAR SESION
// =============================

if(!usuario){

    window.location.href = "../index.html";

}


// =============================
// LOGOUT
// =============================

function logout(){

    localStorage.removeItem("usuario");

    window.location.href = "../index.html";

}