package com.textileERP.textileSys.controller;
import com.textileERP.textileSys.dto.WeftDispatchDto;
import com.textileERP.textileSys.model.WeftDispatch;
import com.textileERP.textileSys.service.WeftDispatchService;
import org.springframework.http.*; import org.springframework.web.bind.annotation.*; import java.util.List;
@RestController @RequestMapping("/api/weft-dispatches") @CrossOrigin(origins="*")
public class WeftDispatchController {
 private final WeftDispatchService service; public WeftDispatchController(WeftDispatchService s){service=s;}
 @GetMapping public List<WeftDispatch> all(){return service.getAll();}
 @PostMapping public ResponseEntity<WeftDispatch> create(@RequestBody WeftDispatchDto d){return new ResponseEntity<>(service.create(d),HttpStatus.CREATED);}
 @PutMapping("/{id}") public ResponseEntity<WeftDispatch> update(@PathVariable Long id,@RequestBody WeftDispatchDto d){return ResponseEntity.ok(service.update(id,d));}
 @PutMapping("/{id}/status") public ResponseEntity<WeftDispatch> status(@PathVariable Long id,@RequestParam String value){return ResponseEntity.ok(service.setStatus(id,value));}
 @DeleteMapping("/{id}") public ResponseEntity<Void> delete(@PathVariable Long id){service.delete(id);return ResponseEntity.noContent().build();}
}
