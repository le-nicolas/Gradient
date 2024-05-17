import matplotlib.pyplot as plt
import numpy as np

# method to find that minimum of a function
def gradient_descent(x_start, learning_rate, num_iterations):# initial guess, how big of a step to take each step, how many steps
    x = x_start
    x_list = [x]  # List to store the updates of x
    for i in range(num_iterations):
        gradient = 2*x  # Gradient of our function
        x = x - learning_rate * gradient
        x_list.append(x) # return a list of all the intermediate estimates of the minimum
    return x, x_list

x_start = 5  # Some initial value for x
learning_rate = 0.01  # The learning rate
num_iterations = 1000  # The number of iterations to perform

x_min, x_list = gradient_descent(x_start, learning_rate, num_iterations)
print("The local minimum occurs at", x_min)

# Plotting the function and the path taken by gradient descent
x = np.linspace(-1, 6, 400)
y = x**2

#generate a range of x values and calculate the corresponding y values for the function f(x) = x^2
#show the path taken by gradient descent on the function f(x) = x^2
# x values are the intermediate estimates of the minimum and y values are the corresponding function values
plt.figure(figsize=[10,5])
plt.plot(x, y, label='f(x) = x^2')
plt.scatter(x_list, [i**2 for i in x_list], color='red')
plt.title('Gradient descent on f(x) = x^2')
plt.xlabel('x')
plt.ylabel('f(x)')
plt.legend()
plt.show()

#note! this is independent to main.py
