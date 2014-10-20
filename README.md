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
seen when taking a RESTful approach.

## Why
Ajax gets messy and model-bound API routes are not always
the best solution for applications with more complex business logic. Rather
than struggling through the boilerplate view definition and basic validation
of a request, django-commands allows you to focus solely on your business logic
because you can be sure that anything that reaches your #handle method was
valid in terms of parameter existence, parameter type, user authentication,
and user permissions. It's only up to you to decide if it's valid based on model 
existence and your business rules.

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
  - String
  - String Arrays
  - Number
  - Number Arrays
  - Object*
  - Object* Arrays
  - File
  - File Arrays
  - Blob
  - Blob Arrays

_*Object types consist of a standard JavaScript object that combines any number of the other types using string keys_

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
from .models import *

class MyCommandHandler(CommandHandlerBase):

	# the name of the command
	command_name = 'SOME_CANONICAL_COMMAND_NAME'

	# parameters that are required in order to be considered a valid command request
	params = [
		Param('number', Param.TYPE.NUMBER),
		Param('message', Param.TYPE.STRING),
		Param('counts', Param.TYPE.NUMBER_ARRAY)
	]

	# request won't even make it to the handle method if they aren't authenticated
    auth_required = True
    
    # request won't even make it to the handle method if they don't have the permissions listed.
    required_permissions = ['superuser']
    
    # if all validation based on the static fields passes, then this class is instantiated
    # and the request and the appropriate data is passed into the command_data
	def handle(self, request, data):
   
        instances = MyModel.objects.filter(number = data.number)
        
        if instances.exists():
            instance = instances[0]
            instance.message = data.message
            instance.sum = sum(data.counts)
            instance.save()
            return self.success({'responseMessage': 'Woohoo! You win!'})
        else:
            return self.error("No model existed for the provided number.")
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

```

## License
Copyright (c) 2014, Paul V Rutledge
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.