document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const usuario = document.getElementById('usuario').value;
    const senha = document.getElementById('senha').value;
  
    // Aqui você pode validar o usuário/senha se desejar
  
    // Salva o nome do usuário no localStorage
    localStorage.setItem('usuarioLogado', usuario);
  
    // Salva um playerId único baseado no nome do usuário
    localStorage.setItem('playerId', 'player_' + usuario);
  
    // Redireciona para o jogo
    window.location.href = 'index.html';
  });