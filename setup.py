import os
from setuptools import setup

def read(file_name):
	return open(os.path.join(os.path.dirname(__file__), file_name)).read()

setup(
	name="django-commands",
	version="0.0.1",
	author="Paul Rutledge",
	author_email="paul.v.rutledge@gmail.com",
	description="A django app that provides a plugin type model for integrating the front and backend.",
	license="BSD",
	keywords="django command strategy plugin",
	url="https://github.com/RutledgePaulV/django-commands",
	packages=["commands", "tests"],
	long_description=read('README'),
	dependency_links=[
		"git+https://github.com/RutledgePaulV/django-toolkit"
	],
	classifiers=[
		"Development Status :: 2 - Pre-Alpha",
		"Framework :: Django",
		"Topic :: Utilities",
		"License :: OSI Approved :: BSD License",
	],
)
