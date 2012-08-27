<?php

/**
 * Single RB Record base class
 *
 * @author Adam Bukowski <abukowski@telaxus.com>
 */
class RBO_Record implements ArrayAccess {

    /** @var RBO_Recordset */
    private $__recordset;
    private $__records_id;

    /**
     * Readonly variable. Modifications of this variable will not be saved.
     * @var int */
    public $id;

    /**
     * Is record visible to user or was deleted.
     * 
     * Readonly variable. Modifications of this variable will not be saved.
     * @var bool */
    public $_active;

    /**
     * Id of user that created record.
     * 
     * Readonly variable. Modifications of this variable will not be saved.
     * @var int */
    public $created_by;

    /**
     * Time and Date of records creation.
     * 
     * Readonly variable. Modifications of this variable will not be saved.
     * @var timestamp */
    public $created_on;

    public final function __construct(RBO_Recordset & $recordset, array $array) {
        $this->__recordset = $recordset;
        foreach ($array as $property => $value) {
            $property = str_replace(array(':', ' '), '_', $property);
            $this->$property = $value;
        }
        if (isset($this->id))
            $this->__records_id = $this->id;
        $this->init();
    }

    public function init() {
        
    }

    private function _defined_public_properties() {
        $refl = new ReflectionObject($this);
        $props = $refl->getProperties(ReflectionProperty::IS_PUBLIC);
        $ret = array();
        foreach ($props as $pro)
            $ret[$pro->getName()] = $pro->getValue($this);
        return $ret;
    }

    private function _values() {
        $values = $this->_defined_public_properties();
        unset($values['created_on']);
        unset($values['created_by']);
        unset($values['_active']);
        unset($values['id']);
        return $values;
    }
    
    private function _is_private_property($property) {
        // below code is faster than
        //   substr($property, 0, 2) == '__' 
        // or strpos($property, '__') === 0
        return isset($property[0]) && isset($property[1]) && $property[0] == '_' && $property[1] == '_';
    }

    public function __set($name, $value) {
        if ($this->_is_private_property($name))
            trigger_error(__('Cannot use "%s" as property name.', $name), E_USER_ERROR);
        $this->$name = $value;
    }

    public function __get($name) {
        if ($this->_is_private_property($name))
            trigger_error(__('Cannot use "%s" as property name.', $name), E_USER_ERROR);        
        return $this->$name;
    }

    public final function save() {
        if ($this->__recordset !== null) {
            if ($this->id === null) {
                $rec = $this->__recordset->new_record($this->_values());
                if ($rec === null)
                    return false;
                $this->__records_id = $this->id = $rec->id;
                return true;
            } else
                return $this->__recordset->update_record($this->__records_id, $this->_values());
        } else {
            trigger_error(__('Trying to save record that was not linked to proper recordset'), E_USER_ERROR);
        }
        return false;
    }

    public final function duplicate() {
        $c = clone $this;
        $c->created_by = $c->created_on = $c->id = null;
        return $c;
    }

    public final function create_default_linked_label($nolink = false, $table_name = true) {
        return $this->__recordset->create_default_linked_label($this->__records_id, $nolink, $table_name);
    }

    public final function create_linked_label($field, $nolink = false) {
        return $this->__recordset->create_linked_label($field, $this->__records_id, $nolink);
    }

    public function offsetExists($offset) {
        if (!$this->_is_private_property($offset))
            return property_exists($this, $offset);
        return false;
    }

    public function offsetGet($offset) {
        if (!$this->_is_private_property($offset))
            return $this->$offset;
        return null;
    }

    public function offsetSet($offset, $value) {
        $this->__set($offset, $value);
    }

    public function offsetUnset($offset) {
        if (!$this->_is_private_property($offset))
            unset($this->$offset);
    }

}

?>