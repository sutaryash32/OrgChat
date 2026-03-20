package com.orgchat.repository;

import com.orgchat.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<User, String> {

    Optional<User> findByEmail(String email);

    Optional<User> findByMerID(String merID);

    boolean existsByEmail(String email);

    boolean existsByMerID(String merID);
}
