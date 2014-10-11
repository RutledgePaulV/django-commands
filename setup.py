import os
from setuptools import setup

def read(file_name):
    return open(os.path.join(os.path.dirname(__file__), file_name)).read()

setup(
    name = "django-commands",
    version = "0.0.1",
    author = "Paul Rutledge",
    author_email = "paul.v.rutledge@gmail.com",
    description = ("A django app that provides a plugin type model for integrating the front and backend."),
    license = "BSD",
    keywords = "django command strategy plugin",
    url = "https://github.com/RutledgePaulV/django-commands",
    packages=['ajax_commands', 'tests'],
    long_description=read('README'),
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Topic :: Django Ajax App",
        "License :: OSI Approved :: BSD License",
    ],
)