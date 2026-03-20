package com.orgchat.service;

import com.orgchat.model.User;
import com.orgchat.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public Optional<User> findByMerID(String merID) {
        log.debug("Looking up user by merID: {}", merID);
        Optional<User> user = userRepository.findByMerID(merID);
        if (user.isPresent()) {
            log.debug("Found user: {} ({})", user.get().getDisplayName(), merID);
        } else {
            log.warn("User not found for merID: {}", merID);
        }
        return user;
    }

    public Optional<User> findByEmail(String email) {
        log.debug("Looking up user by email: {}", email);
        return userRepository.findByEmail(email);
    }

    public Optional<User> findById(String id) {
        log.debug("Looking up user by id: {}", id);
        return userRepository.findById(id);
    }

    public List<User> findAll() {
        List<User> users = userRepository.findAll();
        log.info("Fetched all users, count: {}", users.size());
        return users;
    }

    public User save(User user) {
        log.info("Saving user: {} ({})", user.getMerID(), user.getEmail());
        User saved = userRepository.save(user);
        log.debug("User saved with id: {}", saved.getId());
        return saved;
    }
}
