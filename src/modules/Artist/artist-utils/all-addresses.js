export const allAddresses = (addresses) => {
    return addresses.map(address => {
        return {
            alias: address.alias,
            street: address.street,
            region: address.region,
            city: address.city,
            country: address.country,
            postalCode: address.postalCode ?? null,
            phone: address.phone ?? null,
        }
    })
}