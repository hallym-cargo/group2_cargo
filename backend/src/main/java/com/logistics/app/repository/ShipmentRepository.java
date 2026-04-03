package com.logistics.app.repository;

import com.logistics.app.entity.Shipment;
import com.logistics.app.entity.ShipmentStatus;
import com.logistics.app.entity.User;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ShipmentRepository extends JpaRepository<Shipment, Long> {
    List<Shipment> findByShipper(User shipper);
    List<Shipment> findByAssignedDriver(User driver);
    List<Shipment> findByStatusIn(List<ShipmentStatus> statuses);
    Page<Shipment> findAll(Pageable pageable);
    long countByStatus(ShipmentStatus status);
}
