package com.example.bamoe.service;

import com.example.bamoe.model.Customer;
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;

@RegisterRestClient(configKey = "customer-api")
public interface CustomerService {

    @GET
    @Path("/users/{id}")
    Customer getCustomerById(@PathParam("id") String id);
}
