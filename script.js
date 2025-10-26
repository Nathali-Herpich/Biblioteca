const BACKEND_URL = 'http://localhost:8080/api/livros'; 

let livros = []; 
function mostrarMensagem(texto) {
    const msg = document.createElement('div');
    msg.className = 'mensagem-flutuante';
    msg.textContent = texto;
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 3000);
}
function formatarStatus(status) {
    switch (status) {
        case 'lido':
            return 'Já li';
        case 'quero-ler':
        case 'quero_ler': 
            return 'Quero ler';
        case 'comprar':
            return 'Lista de compras';
        default:
            return '';
    }
}
async function buscarLivroOnline() {
    const titleInput = document.getElementById('title');
    const title = titleInput.value.trim();
    
    if (!title) {
        alert('Digite o título do livro para buscar.');
        return;
    }

    try {
        const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(title)}&maxResults=1`);
        
        if (!response.ok) {
             throw new Error(`Erro HTTP ao acessar a API do Google: ${response.status}`);
        }

        const data = await response.json();

        if (data.totalItems > 0) {
            const book = data.items[0].volumeInfo;
            const coverInput = document.getElementById('cover');
            
            document.getElementById('author').value = book.authors ? book.authors.join(', ') : '';
            const coverUrl = book.imageLinks ? book.imageLinks.thumbnail : '';
            coverInput.value = coverUrl || ''; 
            const previewImg = document.getElementById('previewImg');
            if (coverUrl) {
                previewImg.src = coverUrl;
                previewImg.style.display = 'block';
            } else {
                previewImg.src = '';
                previewImg.style.display = 'none';
            }
            mostrarMensagem('Livro encontrado!');

        } else {
            alert('Livro não encontrado. Preencha os campos manualmente.');
        }
    } catch (error) {
        alert('Erro ao buscar o livro online. Verifique sua conexão e o console do navegador (F12) para detalhes.');
        console.error("Detalhes do erro de busca online:", error);
    }
}
async function renderizarLivros(busca = null) {
    const lista = document.getElementById('books');
    lista.innerHTML = '<li><div class="loading">Carregando livros do servidor...</div></li>'; 
    
    try {
        let url = BACKEND_URL;
        if (busca) {
            url += `?busca=${encodeURIComponent(busca)}`;
        }
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Erro ao buscar livros do servidor.');
        }
        
        livros = await response.json(); 
        
        lista.innerHTML = ''; 
        if (livros.length === 0) {
            lista.innerHTML = '<li>Nenhum livro encontrado.</li>';
            return;
        }
        livros.forEach((livro) => {
            const li = document.createElement('li');
            li.classList.add('livro-item', 'animar');
            li.innerHTML = `
              <img src="${livro.cover}" alt="Capa do livro ${livro.title}" onerror="this.src='https://via.placeholder.com/150?text=Sem+Capa'" />
              <strong>${livro.title}</strong>
              <span>${livro.author}</span>
              <span class="book-status ${livro.status}">${formatarStatus(livro.status)}</span>
              <button class="excluir-btn" onclick="excluirLivro(${livro.id})">Excluir</button>
            `;

            lista.appendChild(li);
        });
        
    } catch (error) {
        lista.innerHTML = '<li>Erro ao conectar com o servidor. Verifique se o Spring Boot está ativo em localhost:8080.</li>';
        console.error("Erro ao renderizar livros do backend:", error);
    }
}
async function excluirLivro(id) {
    if (confirm('Tem certeza que deseja excluir este livro?')) {
        try {
            const response = await fetch(`${BACKEND_URL}/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                 throw new Error('Falha ao excluir o livro.');
            }

            mostrarMensagem('Livro excluído com sucesso.');
            await renderizarLivros();
        } catch (error) {
            alert('Erro ao excluir o livro. Tente novamente.');
            console.error(error);
        }
    }
}
document.getElementById('book-form').addEventListener('submit', async function (event) {
    event.preventDefault();

    const title = document.getElementById('title').value.trim();
    const author = document.getElementById('author').value.trim();
    const status = document.getElementById('status').value;
    let cover = document.getElementById('cover').value.trim(); 

    if (!title || !author || !status) {
        alert('Preencha título, autor e status.');
        return;
    }

    const novoLivro = {
        title,
        author,
        cover: cover || 'https://via.placeholder.com/150?text=Sem+Capa', 
        status
    };

    try {
        const response = await fetch(BACKEND_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(novoLivro)
        });

        if (!response.ok) {
             const errorBody = await response.text();
             console.error("Erro do servidor ao adicionar livro:", errorBody);
             throw new Error(`Falha ao adicionar o livro. Status: ${response.status}`);
        }

        this.reset();
        const previewImg = document.getElementById('previewImg');
        previewImg.src = '';
        previewImg.style.display = 'none';
        
        document.getElementById('cover').value = ''; 

        mostrarMensagem('Livro adicionado com sucesso!');
        await renderizarLivros();
    } catch (error) {
        alert('Erro ao salvar o livro. Verifique a conexão com o servidor. (Detalhes no Console F12)');
        console.error(error);
    }
});

document.getElementById('search').addEventListener('input', function () {
    const filtro = this.value.trim();
    renderizarLivros(filtro); 
});
window.addEventListener('load', () => {
    renderizarLivros();
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then(reg => console.log('Service Worker registrado com sucesso:', reg))
        .catch(err => console.log('Falha ao registrar Service Worker:', err));
    });
}