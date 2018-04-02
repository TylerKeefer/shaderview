local config = {
    data = {}
}

function config:mixin(t)
    for k, v in pairs(t) do
        if type(v) == "table" then
            if Lume.isarray(v) then
                self.data[k] = v
            else
                self:mixin(v)
            end
        else
            self.data[k] = v
        end
    end
end

function config:load(file)
    local info = love.filesystem.getInfo(file, 'file')
    if not info then
        error('Config file "' .. file .. '" does not exist!')
    end
    self:mixin(love.filesystem.load(file)())
end

return config
