package com.example.demo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/livros")
@CrossOrigin(origins = "http://127.0.0.1:5500")
public class LivroController {

    @Autowired
    private LivroRepository livroRepository;

    @GetMapping
    public List<Livro> getAllLivros(@RequestParam(required = false) String busca) {
        if (busca != null && !busca.trim().isEmpty()) {
            return livroRepository.findByTitleContainingIgnoreCaseOrAuthorContainingIgnoreCase(busca, busca);
        }
        return livroRepository.findAll();
    }

    @PostMapping
    public Livro createLivro(@RequestBody Livro livro) {
        return livroRepository.save(livro);
    }

    @DeleteMapping("/{id}")
    public void deleteLivro(@PathVariable Long id) {
        livroRepository.deleteById(id);
    }
}
