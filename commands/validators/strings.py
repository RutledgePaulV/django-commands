from commands.decorators.validator import validator
import re


def not_blank(key, message, order=0):

	@validator(key, message, order)
	def result(value):
		return value and value.strip()

	return result


def email(key, message, order=0):

	regex = re.compile(r'[^@]+@[^@]+\.[^@]+')

	@validator(key, message, order)
	def result(value):
		return regex.match(value)

	return result


def regex(regex_string, key, message, order=0):

	compiled = re.compile(regex_string)

	@validator(key, message, order)
	def result(value):
		return compiled.match(value)

	return result

