require 'liquid'

module Jekyll
  module MiscFilters
    # fallback if value unspecified
    def is_nil(value, fallback)
      return value == nil ? fallback : value
    end

    # get list of hash keys or array entries
    def object_items(object)
      if object.is_a?(Hash)
        return object.keys
      elsif object.is_a?(Array)
        return object
      end
      return object
    end

  end

end

Liquid::Template.register_filter(Jekyll::MiscFilters)
