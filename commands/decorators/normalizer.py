class normalizer(object):
	"""
		The normalizer decorator is a method decorator that specifies
		a key of the expected param that it should normalize. Normalization
		consists of any data transformation that should always occur prior
		to custom validation and use inside of a command handler
	"""

	def __init__(self, key, *args, **kwargs):
		self.key = key
		self.order = kwargs['order'] if 'order' in kwargs else 0

	def __call__(self, func):
		func.normalizer = True
		func.key = self.key
		return func