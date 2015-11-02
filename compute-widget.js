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

  var consoleTemplate = _.template(
    '<div class="js-console modal hide fade">' +
    '  <div class="modal-header">' +
    '    <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>' +
    '    <h3>compute.Instance</h3>' +
    '  </div>' +
    '  <div class="modal-body">' +
    '  <ul class="nav nav-tabs js-compute-tabs">' +
    '    <li class="active"><a href="#execute">Execute command</a></li>' +
    '    <li class="">      <a href="#get">Reveal files</a></li>' +
    '    <li class="">      <a href="#put">Upload file</a></li>' +
    '  </ul>' +    
    '  <div class="tab-content">' +
    '    <div class="tab-pane active" id="execute">' +
    '       <pre id="compute-widget-console"/>' +      
    '       <input type="text"/>' +
    '       <button type="button" class="js-execute-file">Execute</button>' +
    '    </div>' +
    '    <div class="tab-pane" id="get">...</div>' +
    '    <div class="tab-pane" id="put"><input type="file"/></div>' +
    '  </div>' +
    '  </div>' +
    '</div>'
  );

  function openConsole() {            
    var $console = $("body").find(".js-console");
    if ($console.length == 0) {
      $console = $(consoleTemplate());
      $("body").append($console);
    }
    $console.on("click", ".close", function() {
      $console.removeClass("in");
    });
    $console.find('.js-compute-tabs a').click(function (e) {
      e.preventDefault();
      $(this).tab('show');
    });
    $console.attr("style", "display: block;").addClass("in");
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