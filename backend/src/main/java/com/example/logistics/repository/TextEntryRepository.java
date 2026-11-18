package com.example.logistics.repository;

import com.example.logistics.model.TextEntry;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TextEntryRepository extends JpaRepository<TextEntry, Long> {
}
