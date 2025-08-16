// ...
let bagLengthCm: number, bagWidthCm: number, bagHeightCm: number;

if (selectedUserBag) {
  // ...
  bagLengthCm = parseFloat(userBag.bag.lengthCm);
  bagWidthCm = parseFloat(userBag.bag.widthCm);
  bagHeightCm = parseFloat(userBag.bag.heightCm);
  setIsPetCarrier(userBag.bag.isPetCarrier);
} else {
  // ...
  const length = parseFloat(dimensions.length);
  const width = parseFloat(dimensions.width);
  const height = parseFloat(dimensions.height);

  if (unit === "in") {
    bagLengthCm = inchesToCm(length);
    bagWidthCm = inchesToCm(width);
    bagHeightCm = inchesToCm(height);
  } else {
    bagLengthCm = length;
    bagWidthCm = width;
    bagHeightCm = height;
  }
}

checkBagMutation.mutate({
  airlineIataCode: selectedAirline,
  flightNumber: flightNumber || undefined,
  bagLengthCm: String(bagLengthCm), // FIX: Convert to string
  bagWidthCm: String(bagWidthCm), // FIX: Convert to string
  bagHeightCm: String(bagHeightCm), // FIX: Convert to string
  isPetCarrier,
  bagId: selectedUserBag || undefined,
});
