# Gradient
is used to minimize a function by iteratively moving in the direction of steepest descent of the function's gradient. 
![Figure_1](https://github.com/le-nicolas/Gradient/assets/112614851/dcabb3e5-355b-4939-8a9d-5113bc6a124b)  ![image](https://github.com/le-nicolas/Gradient/assets/112614851/42adefc1-f942-4bce-a6da-9e3a070c1d60)

The great thing about this is it tracks each progress until it has reached its desired iteration.
It kinda reminds me of newton's-Raphson method, is an iterative numerical method for finding successively better approximations to the roots (or zeroes) of a real-valued function. (in short find the square root via iteration.)

Both of them:
use iterative processes that update the current estimate based on some calculated adjustment.
and you can see that the function behaves nicely if its close to its intent.

difference: 
is just their goals.

One nice thing about gradient is that it is broad and can be applied in many ways.
1 application i use is for image processing(sketch)


Image gradients are a measure of intensity change in an image, and they point in the direction of the greatest rate of change in intensity. 
Edge detection algorithms like the Sobel operator use these gradients to find the boundaries of objects within images. 
The concept of thresholding the gradient magnitude to find high intensity gradients.(Thresholding the gradient magnitude is a common technique used in image processing to detect edges or changes in intensity in an image.

The gradient of an image measures the change in intensity of the pixels. A high gradient value at a particular pixel position means there is a significant change in color or intensity, indicating the presence of an edge.

The gradient magnitude is calculated as the square root of the sum of the squares of the gradients in the x and y directions. This gives a single value that represents the total rate of change in both directions.

Thresholding is then applied to this gradient magnitude image. This means that all pixels with a gradient magnitude above a certain value (the threshold) are considered edges, while all pixels with a gradient magnitude below this value are not. This results in a binary image where the edges are highlighted.)

![cute](https://github.com/le-nicolas/Gradient/assets/112614851/b0da6ea7-eedc-49bc-b494-634824bb01b2)  ![output10](https://github.com/le-nicolas/Gradient/assets/112614851/99c957f8-f93d-4f1f-9c5d-764092091ecb)

