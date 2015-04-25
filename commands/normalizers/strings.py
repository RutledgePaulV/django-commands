from commands.decorators.normalizer import normalizer
import html, re


def lowercase(key, order=0):

	@normalizer(key, order)
	def result(value):
		return value.lower()

	return result


def uppercase(key, order=0):

	@normalizer(key, order)
	def result(value):
		return value.upper()

	return result


def strip(key, order=0):

	@normalizer(key, order)
	def result(value):
		return value.strip()

	return result


def html_encode(key, order=0):

	@normalizer(key, order)
	def result(value):
		return html.escape(value)

	return result


def html_decode(key, order=0):

	@normalizer(key, order)
	def result(value):
		return html.unescape(value)

	return result


def only_numbers(key, order=0):

	regex = re.compile(r'[^\d]+')

	@normalizer(key, order)
	def result(value):
		return regex.sub('', value)

	return result