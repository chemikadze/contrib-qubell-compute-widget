(function(){

  var instanceTemplate = _.template(
    '<span class="network">' +
    '  <table>' +      
    '  <% for(var networkId in networks){ %>' +
    '    <% var item = networks[networkId] %>' +
    '    <tr>' +
    '      <td><b><%= networkId %></b></td><td>' +
    '      <td>' + 
    '          <a href="#" class="js-open-console" data-ip="<%= item.ip %>"><%= item.ip %></a>' +
    '          <a href="#" class="js-open-console" data-ip="<%= item.ipv6 %>"><%= item.ipv6 %></a>' +
    '      </td>' +       
    '    </tr>' +
    '  <% } %>' +     
    '  </table>' +
    '</span>' 
  )

  var dashboardTemplate = _.template(
    '<span class="networks-small"> ' +
    '<% for(var networkId in networks){ %>' +
    '  <% var item = networks[networkId] %>' +
    '  <a href="#" class="js-open-console" data-ip="<%= item.ip %>"><%= item.ip %></a>' +
    '  <a href="#" class="js-open-console" data-ip="<%= item.ipv6 %>"><%= item.ipv6 %></a>' +
    '<% } %>' +
    '</span>'
  )

  function openConsole() {
    alert($(this).attr('data-ip') + ' action!')
  }
  
  function ComputeInstance(property, location, instance) {
    var template;
    if (location != 'instance-dashboard') {
      template = instanceTemplate;
    } else {
      template = dashboardTemplate;
    }
    var $elements = $(template({networks: property.runtimeValue}));  
    $elements.on('click', '.js-open-console', openConsole);
    if (this instanceof Node) {
      return $(this).empty().append($elements).get(0);
    } else {
      return $elements;
    }
  }

  // widget api v1
  app.propertyWidgets.getWidgetName = function(instance, returnValue, userValue){
    if(returnValue.id == 'compute.networks') return 'ComputeInstance'
    else                                     return 'Default'
  }
  app.propertyWidgets.ComputeInstance = {
    layout      : 'block',
    render      : function(instance, returnValue, userValue) {
      return $(ComputeInstance({runtimeValue: returnValue.value}, "instance", instance));
    },
    renderSmall : function(instance, returnValue, userValue) {
      return $(ComputeInstance({runtimeValue: returnValue.value}, "instance-dashboard", instance));
    }
  }

  // widget api v2
  app.widgets.registerWidgetRouter(function(property, location, instance){
    var name = property.path[0];
    if (location.indexOf('instance') == 0 && name.indexOf && name.indexOf("networks") >= 0) {
      return ComputeInstance
    }
  });

})()