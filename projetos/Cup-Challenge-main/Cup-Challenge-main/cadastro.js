document.querySelector(".formulario-cadastro").addEventListener("submit", function (e) {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const usuario = document.getElementById("usuario").value;
    const senha = document.getElementById("senha").value;

    const novoUsuario = {
        email,
        usuario,
        senha
    };

    const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];

    // Verifica se já existe o mesmo usuário
    const jaExiste = usuarios.some((u) => u.usuario === usuario);

    if (jaExiste) {
        alert("Nome de usuário já está em uso. Escolha outro.");
        return;
    }

    usuarios.push(novoUsuario);
    localStorage.setItem("usuarios", JSON.stringify(usuarios));

    alert("Conta criada com sucesso!");
    window.location.href = "entrar.html";
});
