package com.orgchat.repository;

import com.orgchat.model.MateRequest;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MateRequestRepository extends MongoRepository<MateRequest, String> {

    // Find pending requests sent TO this user
    List<MateRequest> findByToMerIDAndStatus(String toMerID, String status);

    // Find pending requests sent FROM this user
    List<MateRequest> findByFromMerIDAndStatus(String fromMerID, String status);

    // Find a specific request between two users (either direction)
    @Query("{ $or: [ { 'fromMerID': ?0, 'toMerID': ?1 }, { 'fromMerID': ?1, 'toMerID': ?0 } ] }")
    Optional<MateRequest> findBetween(String merID1, String merID2);

    // Find all accepted mates for a user (either direction)
    @Query("{ $and: [ { 'status': 'ACCEPTED' }, { $or: [ { 'fromMerID': ?0 }, { 'toMerID': ?0 } ] } ] }")
    List<MateRequest> findAcceptedMates(String merID);
}
