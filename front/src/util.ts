function shuffle<T>(array: T[]) {
    let currentIndex = array.length;

    // While there remain elements to shuffle...
    while (currentIndex != 0) {

        // Pick a remaining element...
        let randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }
}

function generateGaussianWeights(numSegments: number, sigma = 1) {
    const weights = [];
    const mean = (numSegments - 1) / 2; // Center of the distribution

    // Generate Gaussian weights
    for (let i = 0; i < numSegments; i++) {
        const exponent = -Math.pow(i - mean, 2) / (2 * Math.pow(sigma, 2)); // Gaussian function
        weights.push(Math.exp(exponent)); // Exponent of the Gaussian function
    }

    // Normalize weights to sum to 1
    const total = weights.reduce((sum, w) => sum + w, 0);
    return weights.map(w => w / total);
}

// Function to split an array into segments based on Gaussian weights
function splitArrayByGaussianDistribution<T>(array: T[], numSegments = 10, sigma = 1):T[][] {
    const weights = generateGaussianWeights(numSegments, sigma);
    const totalItems = array.length;

    // Calculate the number of items in each segment
    const segmentSizes = weights.map(weight => Math.round(weight * totalItems));

    // Ensure the total matches the array length (adjust due to rounding errors)
    let sizeAdjustment = totalItems - segmentSizes.reduce((sum, size) => sum + size, 0);
    for (let i = 0; sizeAdjustment !== 0; i = (i + 1) % segmentSizes.length) {
        if (sizeAdjustment > 0) {
            segmentSizes[i]++;
            sizeAdjustment--;
        } else if (segmentSizes[i] > 0) {
            segmentSizes[i]--;
            sizeAdjustment++;
        }
    }

    // Split the array into segments
    const segments = [];
    let currentIndex = 0;
    for (const size of segmentSizes) {
        segments.push(array.slice(currentIndex, currentIndex + size));
        currentIndex += size;
    }

    return segments;
}


export const splitArray = <T>(array: T[]): T[][] => {
    shuffle(array);
    return splitArrayByGaussianDistribution(array, 10, 2);
}