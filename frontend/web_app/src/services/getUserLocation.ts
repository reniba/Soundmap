async function getUserLocation() {
  return new Promise<{
    latitude: number;
    longitude: number;
  }>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      reject,
    );
  });
}

export default getUserLocation;
