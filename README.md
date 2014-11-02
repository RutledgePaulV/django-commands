## What
Django-commands is a reusable django app that helps idiot-proof and
simplify the process of writing client-side and server-side
code for communicating via ajax. A command handler is a replacement 
for the standard django view and is intended to deal strictly with ajax 
requests in json format.

## How
By using a plugin-architecture and auto-discovery of modules across
your existing apps, django-commands removes the need to have the same 
sort of redundant boilerplate validation for views intended to handle ajax requests.
Ultimately, it allows operations to be more driven by the business
logic of the application and less bound to models like what is often
seen today in CRUD scaffolding demos and the like.

## Why
Ajax gets messy and model-bound API routes are not always
the best solution for applications with more complex business logic. Rather
than struggling through the boilerplate view definition and basic validation
of a request, django-commands allows you to focus solely on your business logic
because you can be sure that anything that reaches your #handle method was
valid in terms of parameter existence, parameter type, user authentication,
and user permissions. It's only up to you to decide if it's valid based on your 
business rules.

## Goals
- Do not impede performance to any sort of noticeable level.
- Keep the implementation of a command handler simple, explicit, and elegant.
- Make command strategy a viable approach to doing rapid and robust web development with django.
- Should be no reason to have to venture outside of the command handler strategy for any
  form posts or ajax procedures within an application.
- Perform thorough validation of a request on front-end and back-end so that
  developers get immediate and telling feedback.
- Keep JavaScript lightweight and follow best practices regarding defining
  a library.
- Write clean, robust, well-documented, and well-tested code that makes
  django-commands more than a one-off project.
- Allow commands to take arbitrary amount of keys consisting of data of 
  the following types and correctly upload them, pass thorough validation, 
  and reach the handler in a directly usable format.
  - Blob
  - File
  - String
  - Float
  - Integer
  - Object*
  - String Array
  - Float Array
  - Integer Array
  - Object* Array

_*For django-commands, object types consist of a standard JavaScript object that
may combine any of the other types except for Blobs and Files. Currently there
is no specification for expressing nested types requirements, so specifying the
object type only guarantees you'll receive a dictionary in the command handler._

## Installation

### Get the package
```bash
pip install git+https://github.com/RutledgePaulV/django-commands.git
```

### Register as an installed application
```python
#settings.py
INSTALLED_APPS = (
	...
	'django-commands',
)
```

## Usage

### Setup Routes
Add this one line to your root urls.py. You can change the actual route if you want and
the correct endpoints will still be set inside the client-side code, just don't change the 
namespace. 
```python
url(r'^commands/', include('commands.urls', namespace='commands')),
```

### Create Command Handler
Inside your custom apps where you want to use commands, create a file `commands.py`

Inside of that file you define your logic for all the commands you want available for that application. I've given
a simple example below.

```python
from commands.base import *
from commands.types import *
from commands.decorators import *
from .models import *

class MyCommandHandler(CommandHandlerBase):

	# the name of the command
	command_name = 'SOME_CANONICAL_COMMAND_NAME'

	# parameters that are required in order to be considered a valid command request
	params = [
		Param('number', Types.INTEGER),
		Param('message', Types.STRING),
		Param('counts', Types.INTEGER_ARRAY)
	]

	# request won't even make it to the handle method if they aren't authenticated
    auth_required = True
    
    # request won't even make it to the handle method if they don't have the permissions listed.
    permissions = ['superuser']
    
    # if all validation based on the static fields passes, then this class is instantiated
    # and the request and the appropriate data is passed into the command_data
	def handle(self, request, data):
   
        instance = MyModel.objects.get(number = data.number)
        instance.message = data.message
        instance.sum = sum(data.counts)
        instance.save()
        return self.success({'responseMessage': 'Woohoo! You win!'})
    
   
    # you can implement @validator decorated methods for some additional validation
    # prior to instantiation / reaching the #handle method. Here we check that number
    # is not negative
   
    @validator('number', 'The number parameter cannot be negative.')
    def validate_number(number):
        return number >= 0
```

### Include Static Files
Just add the following line to the header of whichever
pages you plan to be using ajax commands. The front-end scripts
assume that you are already using jQuery.
```jinja2
{% include 'commands/scripts.html' %}
```

### Use The Commands
```JavaScript

// this will make the front-end aware of all the available
// commands that you've defined in commands.py files across
// all of your apps. All available commands (based on user permissions
// and authentication status will be populated into _.registry
_.UpdateDefinition();

// this will attempt to post the command to your handler,
// but first it will do some checks to make sure you have
// the required data parameters and that they are of the
// right type. This validation occurs on the front end
// and on the backend. This call without data won't work
// for the command that we defined.
_.registry.SOME_CANONICAL_COMMAND_NAME.fire();

// defining legitimate data
var data = {number: 5, message: 'my message', counts: [5, 6, 7]};

// if status==200 on the response (they called return self.success())
var successHandler = function(data){
	alert(data.results[0].responseMessage); // alerts Woohoo! You Win!
}

// if status!=200 on the response (they called return self.error() or validation failed)
var errorHandler = function(data){
	alert(data.error);
}

// making the actual call with data and callbacks
_.registry.SOME_CANONICAL_COMMAND_NAME.fire(data, successHandler, errorHandler);


// What if number was negative?
errorHandler = function(data){
    alert(data.errors['number']);
}

data.number = -1;

// This will alert: 'The number parameter cannot be negative.'
_.registry.SOME_CANONICAL_COMMAND_NAME.fire(data, successHandler, errorHandler);
```