package com.orgchat.config;

import com.orgchat.model.MateRequest;
import com.orgchat.model.Message;
import com.orgchat.model.User;
import com.orgchat.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DatabaseMigrationRunner implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseMigrationRunner.class);

    private final UserRepository userRepository;
    private final MongoTemplate mongoTemplate;

    public DatabaseMigrationRunner(UserRepository userRepository, MongoTemplate mongoTemplate) {
        this.userRepository = userRepository;
        this.mongoTemplate = mongoTemplate;
    }

    @Override
    public void run(String... args) throws Exception {
        log.info("Starting Global Database Migration Runner...");

        List<User> allUsers = userRepository.findAll();
        int migratedCount = 0;

        for (User user : allUsers) {
            String oldMerID = user.getMerID();
            String email = user.getEmail();

            if (oldMerID != null && oldMerID.length() == 24 && oldMerID.matches("^[0-9a-fA-F]{24}$")) {
                if (email == null || email.isBlank()) {
                    log.warn("Corrupted user {} has no email. Skipping migration.", oldMerID);
                    continue;
                }

                String baseMerID = email.split("@")[0].toLowerCase();
                String newMerID = resolveUniqueMerID(baseMerID);

                log.warn("Migrating user from corrupted ObjectId '{}' to '{}'", oldMerID, newMerID);

                // Delete old corrupted user document
                userRepository.delete(user);

                // Create new sanitized user document
                User newUser = User.builder()
                        .merID(newMerID)
                        .email(email)
                        .displayName(user.getDisplayName() != null ? user.getDisplayName() : newMerID)
                        .ssoProvider(user.getSsoProvider() != null ? user.getSsoProvider() : "google")
                        .role(user.getRole() != null ? user.getRole() : "USER")
                        .createdAt(user.getCreatedAt())
                        .lastLoginAt(user.getLastLoginAt())
                        .build();

                userRepository.save(newUser);

                // Migrate foreign keys in Message collection
                updateCollectionReferences(Message.class, "senderId", oldMerID, newMerID);
                updateCollectionReferences(Message.class, "recipientId", oldMerID, newMerID);

                // Migrate foreign keys in MateRequest collection
                updateCollectionReferences(MateRequest.class, "fromMerID", oldMerID, newMerID);
                updateCollectionReferences(MateRequest.class, "toMerID", oldMerID, newMerID);

                migratedCount++;
            }
        }

        if (migratedCount > 0) {
            log.info("Database Migration Complete: {} users securely migrated.", migratedCount);
        } else {
            log.info("Database Migration Complete: No corrupted users found.");
        }
    }

    private void updateCollectionReferences(Class<?> entityClass, String fieldName, String oldValue, String newValue) {
        Query query = new Query(Criteria.where(fieldName).is(oldValue));
        Update update = new Update().set(fieldName, newValue);
        long modifiedCount = mongoTemplate.updateMulti(query, update, entityClass).getModifiedCount();
        if (modifiedCount > 0) {
            log.info("Migrated {} {} documents changing '{}' -> '{}'", modifiedCount, entityClass.getSimpleName(), oldValue, newValue);
        }
    }

    private String resolveUniqueMerID(String baseMerID) {
        if (!userRepository.existsByMerID(baseMerID)) {
            return baseMerID;
        }
        int suffix = 1;
        while (userRepository.existsByMerID(baseMerID + suffix)) {
            suffix++;
        }
        return baseMerID + suffix;
    }
}
