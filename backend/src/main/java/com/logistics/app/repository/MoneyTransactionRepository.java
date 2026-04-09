package com.logistics.app.repository;

import com.logistics.app.entity.MoneyTransaction;
import com.logistics.app.entity.Shipment;
import com.logistics.app.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MoneyTransactionRepository extends JpaRepository<MoneyTransaction, Long> {
    List<MoneyTransaction> findByUserOrderByCreatedAtDesc(User user);

    boolean existsByShipment(Shipment shipment);

    Optional<MoneyTransaction> findFirstByUserAndShipmentIdOrderByCreatedAtDesc(User user, Long shipmentId);

    List<MoneyTransaction> findByShipmentIdOrderByCreatedAtDesc(Long shipmentId);
}
