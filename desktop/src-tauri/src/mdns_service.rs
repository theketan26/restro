use mdns_sd::{ServiceDaemon, ServiceInfo};
use std::net::{Ipv4Addr, UdpSocket};

/// Register this device as an mDNS service
pub async fn register_mdns_service(
    service_name: &str,
    host_name: &str,
    ip_address: &str,
    port: u16,
) -> Result<ServiceDaemon, Box<dyn std::error::Error>> {
    // Parse IPv4 address
    let ip_addr: Ipv4Addr = ip_address.parse()?;

    // Create mDNS service info
    let service_type = "_stackrise._tcp";

    // Create service
    let service_info = ServiceInfo::new(
        service_type,
        service_name,
        host_name,
        ip_addr,
        port,
        None,
    )?;

    // Start the daemon
    let daemon = ServiceDaemon::new()?;
    daemon.register(service_info)?;

    tracing::info!(
        "mDNS service registered: {} on {}:{}",
        service_name,
        ip_address,
        port
    );

    Ok(daemon)
}

/// Get local IP address (prefer IPv4 on LAN)
pub fn get_local_ip() -> Option<String> {
    // Connect to a public DNS server (doesn't actually send data)
    let socket = UdpSocket::bind("0.0.0.0:0").ok()?;
    socket.connect("8.8.8.8:80").ok()?;

    socket
        .local_addr()
        .ok()
        .map(|addr| addr.ip().to_string())
}
