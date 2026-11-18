package com.example.logistics.controller;

import com.example.logistics.model.TextEntry;
import com.example.logistics.repository.TextEntryRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/texts")
public class TestController {

	private final TextEntryRepository textEntryRepository;

	public TestController(TextEntryRepository textEntryRepository) {
		this.textEntryRepository = textEntryRepository;
	}

	@GetMapping
	public List<TextEntry> findAll() {
		return textEntryRepository.findAll();
	}

	@GetMapping("/{id}")
	public ResponseEntity<TextEntry> findById(@PathVariable Long id) {
		return textEntryRepository.findById(id)
				.map(ResponseEntity::ok)
				.orElseGet(() -> ResponseEntity.notFound().build());
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public TextEntry create(@RequestBody TextEntry request) {
		return textEntryRepository.save(new TextEntry(request.getText()));
	}

	@PutMapping("/{id}")
	public ResponseEntity<TextEntry> update(@PathVariable Long id, @RequestBody TextEntry request) {
		return textEntryRepository.findById(id)
				.map(entry -> {
					entry.setText(request.getText());
					return ResponseEntity.ok(textEntryRepository.save(entry));
				})
				.orElseGet(() -> ResponseEntity.notFound().build());
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		if (!textEntryRepository.existsById(id)) {
			return ResponseEntity.notFound().build();
		}
		textEntryRepository.deleteById(id);
		return ResponseEntity.noContent().build();
	}

}
