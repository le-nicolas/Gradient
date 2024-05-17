# script performs several steps of image processing on a grayscale image, specifically edge detection and gradient calculation.

import cv2
import numpy as np

# Load the image
image = cv2.imread('cute.jpg', cv2.IMREAD_GRAYSCALE)

# Check if the image was loaded successfully
if image is None:
    print('Could not open or find the image')
else:
    # Apply Gaussian blur to the image
    blurred_image = cv2.GaussianBlur(image, (5, 5), 0)#common preprocessing step to reduce image noise and detail.

    # Apply Canny edge detection
    edges = cv2.Canny(blurred_image, threshold1=100, threshold2=200) # detect a wide range of edges in images. The result is a binary image where the edges are white and the rest is black.

    # Calculate the x and y gradients using the Sobel operator
    grad_x = cv2.Sobel(image, cv2.CV_64F, 1, 0, ksize=5) #calculating the gradient of image intensity at each pixel within the image. x direction
    grad_y = cv2.Sobel(image, cv2.CV_64F, 0, 1, ksize=3) #calculating the gradient of image intensity at each pixel within the image. y direction

    # Calculate the magnitude of the gradients
    gradient_magnitude = np.sqrt(grad_x**2 + grad_y**2) #gives a single value that represents the total rate of change in both directions.(length of the vector)

    # Normalize the gradient magnitude to the range 0-255
    gradient_magnitude = (gradient_magnitude / np.max(gradient_magnitude)) * 255 # ensures that the gradient magnitudes are in a range that can be properly displayed as an image.


    # Calculate the magnitude and direction of the gradients
    mag, angle = cv2.cartToPolar(grad_x, grad_y, angleInDegrees=True)# converts Cartesian coordinates to polar coordinates.

    # Threshold the magnitudes
    _, mask = cv2.threshold(mag, 100, 255, cv2.THRESH_BINARY) #all pixels with a gradient magnitude above a certain value (100 in this case) are considered edges, while all pixels with a gradient magnitude below this value are not.

    # Combine the edges and the gradient directions
    combined = np.bitwise_or(edges, mask.astype(np.uint8))#final image where the edges are highlighted.

    # Invert the combined image to get a sketch-like effect
    sketch = cv2.bitwise_not(combined)

    # Save the sketch image
    cv2.imwrite('output.jpg', sketch)
